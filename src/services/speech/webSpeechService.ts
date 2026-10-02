import {
  ISpeechToTextService,
  SpeechMetrics,
  SpeechRecognitionErrorInfo,
  SpeechRecognitionOptions,
  SpeechToTextCallbacks,
  VoiceDebateRecordingResult,
} from '../../types/voice';
import { SpeechAnalysisService } from './speechAnalysisService';

// Extended window interface for speech recognition
interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
  AudioContext?: any;
  webkitAudioContext?: any;
}

export class WebSpeechRecognitionService implements ISpeechToTextService {
  public readonly id = 'web-speech-api';
  public readonly name = 'Browser Web Speech API';
  public readonly description = 'Native browser speech recognition engine with real-time Web Audio API frequency analysis.';

  private recognitionInstance: any = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  private isCurrentlyRecording = false;
  private startTime = 0;
  private accumulatedFinalTranscript = '';
  private currentInterimTranscript = '';

  // Audio pause telemetry
  private detectedPauses: number[] = [];
  private lastSilenceStart: number | null = null;
  private silenceThreshold = 0.04; // volume threshold below which is considered silence
  private peakLevel = 0;
  private totalAudioSamples = 0;
  private sumAudioLevel = 0;

  private callbacks: SpeechToTextCallbacks = {};

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as IWindowWithSpeech;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public isRecording(): boolean {
    return this.isCurrentlyRecording;
  }

  public getAudioAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public async start(options: SpeechRecognitionOptions = {}, callbacks: SpeechToTextCallbacks = {}): Promise<void> {
    if (this.isCurrentlyRecording) {
      this.cancel();
    }

    this.callbacks = callbacks;
    this.callbacks.onStateChange?.('requesting_permission');

    const win = window as IWindowWithSpeech;
    const SpeechRecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      const err: SpeechRecognitionErrorInfo = {
        code: 'unsupported',
        message: 'Speech Recognition is not natively supported in this browser.',
        userGuidance: 'Please use Google Chrome, Microsoft Edge, or a modern Chromium browser with Web Speech enabled.',
        fatal: true,
      };
      this.callbacks.onError?.(err);
      this.callbacks.onStateChange?.('error');
      throw new Error(err.message);
    }

    // 1. Request Microphone MediaStream for Real-Time Audio Visualization & Pause Detection
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        const AudioCtx = win.AudioContext || win.webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }

          const source = this.audioContext.createMediaStreamSource(this.mediaStream);
          this.analyserNode = this.audioContext.createAnalyser();
          this.analyserNode.fftSize = 256;
          this.analyserNode.smoothingTimeConstant = 0.8;
          source.connect(this.analyserNode);

          this.startAudioTelemetryLoop();
        }
      }
    } catch (err: any) {
      console.warn('Microphone audio stream init error (falling back to speech engine only):', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        const errorInfo: SpeechRecognitionErrorInfo = {
          code: 'permission-denied',
          message: 'Microphone access was denied by the browser.',
          userGuidance: 'Click the camera/microphone icon in your browser URL bar and allow microphone permissions for this site.',
          fatal: true,
        };
        this.callbacks.onError?.(errorInfo);
        this.callbacks.onStateChange?.('error');
        throw new Error(errorInfo.message);
      }
    }

    // 2. Initialize and Configure SpeechRecognition instance
    this.recognitionInstance = new SpeechRecognitionConstructor();
    this.recognitionInstance.continuous = options.continuous ?? true;
    this.recognitionInstance.interimResults = options.interimResults ?? true;
    this.recognitionInstance.lang = options.lang || 'en-US';

    this.accumulatedFinalTranscript = '';
    this.currentInterimTranscript = '';
    this.detectedPauses = [];
    this.lastSilenceStart = null;
    this.peakLevel = 0;
    this.totalAudioSamples = 0;
    this.sumAudioLevel = 0;
    this.startTime = Date.now();

    this.recognitionInstance.onstart = () => {
      this.isCurrentlyRecording = true;
      this.callbacks.onStateChange?.('listening');
    };

    this.recognitionInstance.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;
        if (result.isFinal) {
          this.accumulatedFinalTranscript += (this.accumulatedFinalTranscript ? ' ' : '') + transcriptPart.trim();
          this.callbacks.onFinalTranscript?.(transcriptPart.trim(), this.accumulatedFinalTranscript);
        } else {
          interim += transcriptPart;
        }
      }

      this.currentInterimTranscript = interim;
      this.callbacks.onInterimTranscript?.(interim);
    };

    this.recognitionInstance.onerror = (event: any) => {
      console.warn('SpeechRecognition error event:', event.error, event);

      // Handle benign or expected events
      if (event.error === 'no-speech') {
        // Not fatal, just silence
        this.callbacks.onError?.({
          code: 'no-speech',
          message: 'No speech was detected. Keep speaking into your microphone.',
          userGuidance: 'Speak clearly into your microphone.',
          fatal: false,
        });
        return;
      }

      const isFatal = event.error === 'not-allowed' || event.error === 'audio-capture';
      const errorMap: Record<string, { msg: string; guide: string }> = {
        'not-allowed': {
          msg: 'Microphone permission was denied or blocked.',
          guide: 'Please enable microphone permissions in your browser settings or lock icon in the address bar.',
        },
        'audio-capture': {
          msg: 'Could not capture audio from your microphone hardware.',
          guide: 'Verify that your microphone is plugged in, powered on, and selected in system settings.',
        },
        network: {
          msg: 'Speech-to-text service network disconnection.',
          guide: 'Check your internet connection; the browser speech service requires network connectivity.',
        },
      };

      const info = errorMap[event.error] || {
        msg: `Speech recognition error: ${event.error || 'Unknown'}`,
        guide: 'Try refreshing or re-initiating recording.',
      };

      const errorInfo: SpeechRecognitionErrorInfo = {
        code: (event.error as any) || 'unknown',
        message: info.msg,
        userGuidance: info.guide,
        fatal: isFatal,
      };

      this.callbacks.onError?.(errorInfo);
      if (isFatal) {
        this.isCurrentlyRecording = false;
        this.callbacks.onStateChange?.('error');
      }
    };

    this.recognitionInstance.onend = () => {
      // If continuous listening unexpectedly ends while we are supposed to be recording, restart
      if (this.isCurrentlyRecording) {
        try {
          this.recognitionInstance.start();
        } catch {
          // May throw if already active
        }
      }
    };

    try {
      this.recognitionInstance.start();
    } catch (startErr: any) {
      console.error('SpeechRecognition start failed:', startErr);
      throw startErr;
    }
  }

  public async stop(): Promise<VoiceDebateRecordingResult> {
    this.isCurrentlyRecording = false;
    this.callbacks.onStateChange?.('processing');

    const durationSeconds = Math.max(1, (Date.now() - this.startTime) / 1000);

    // Stop speech recognition instance
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch (err) {
        console.warn('Error stopping speech recognition:', err);
      }
    }

    // Stop audio stream & cleanup telemetry
    this.cleanupAudio();

    // Compile full transcript (combining accumulated final + any lingering interim words)
    let fullTranscript = this.accumulatedFinalTranscript.trim();
    if (this.currentInterimTranscript.trim()) {
      fullTranscript = fullTranscript
        ? `${fullTranscript} ${this.currentInterimTranscript.trim()}`
        : this.currentInterimTranscript.trim();
    }

    // Audio metrics calculation
    const avgAudioLevel = this.totalAudioSamples > 0 ? this.sumAudioLevel / this.totalAudioSamples : 60;
    const consistency = Math.max(50, Math.min(95, Math.round(100 - Math.abs(this.peakLevel - avgAudioLevel) * 0.4)));

    // Analyze speech characteristics (speed, pauses, filler words, clarity, disclaimer)
    const metrics = SpeechAnalysisService.analyzeCharacteristics({
      transcript: fullTranscript,
      durationSeconds,
      detectedPauses: this.detectedPauses,
      audioPeakLevel: Math.round(this.peakLevel),
      volumeConsistency: consistency,
    });

    this.callbacks.onStateChange?.('ready_for_review');

    return {
      transcript: fullTranscript,
      metrics,
      audioDurationSeconds: durationSeconds,
    };
  }

  public cancel(): void {
    this.isCurrentlyRecording = false;
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.abort();
      } catch (err) {
        // ignore
      }
      this.recognitionInstance = null;
    }
    this.cleanupAudio();
    this.callbacks.onStateChange?.('idle');
  }

  private cleanupAudio(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }
    this.analyserNode = null;
  }

  private startAudioTelemetryLoop(): void {
    if (!this.analyserNode) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const checkAudio = () => {
      if (!this.isCurrentlyRecording || !this.analyserNode) return;

      this.analyserNode.getByteFrequencyData(dataArray);

      // Compute root-mean-square / average level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length; // 0 - 255
      const normalizedLevel = Math.min(100, Math.round((average / 128) * 100)); // 0 - 100 scale

      // Track peaks and sample sums
      if (normalizedLevel > this.peakLevel) {
        this.peakLevel = normalizedLevel;
      }
      this.sumAudioLevel += normalizedLevel;
      this.totalAudioSamples++;

      // Pause / Silence Detection (>0.85s of silence)
      const now = Date.now();
      const isSilent = average < this.silenceThreshold * 255;

      if (isSilent) {
        if (!this.lastSilenceStart) {
          this.lastSilenceStart = now;
        } else {
          const pauseDuration = (now - this.lastSilenceStart) / 1000;
          if (pauseDuration >= 0.85 && pauseDuration <= 0.95) {
            // Register significant pause
            this.detectedPauses.push(pauseDuration);
            this.callbacks.onPauseDetected?.(pauseDuration);
          }
        }
      } else {
        if (this.lastSilenceStart) {
          const pauseDuration = (now - this.lastSilenceStart) / 1000;
          if (pauseDuration >= 0.85) {
            // Update last pause length
            this.detectedPauses[this.detectedPauses.length - 1] = Number(pauseDuration.toFixed(2));
          }
          this.lastSilenceStart = null;
        }
      }

      this.callbacks.onAudioLevel?.(normalizedLevel, dataArray);
      this.animationFrameId = requestAnimationFrame(checkAudio);
    };

    this.animationFrameId = requestAnimationFrame(checkAudio);
  }
}
