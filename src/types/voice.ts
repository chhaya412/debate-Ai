/**
 * Voice-based debating and speech delivery analysis types
 */

export interface FillerWordOccurrence {
  word: string;
  count: number;
  examples?: string[];
}

export interface SpeechMetrics {
  durationSeconds: number;
  wordCount: number;
  speakingSpeedWpm: number;
  speedRating: 'Too Slow' | 'Deliberate & Measured' | 'Optimal Cadence' | 'Brisk' | 'Fast / Rapid';
  speedDescription: string;
  pauseCount: number;
  totalPauseDurationSeconds: number;
  averagePauseDurationSeconds: number;
  pauseRating: 'Fluid Flow' | 'Balanced Pacing' | 'Frequent Hesitations';
  fillerWordsCount: number;
  fillerWordsRatio: number; // Percentage (e.g., 2.4%)
  fillerWordsDetected: FillerWordOccurrence[];
  clarityScore: number; // 0 - 100
  clarityRating: 'Exceptional Articulation' | 'Clear & Articulate' | 'Moderate Clarity' | 'Needs Pronunciation Focus';
  audioPeakLevel?: number; // 0 - 100
  volumeConsistency?: number; // 0 - 100
  pacingFeedback: string;
  disclaimer: string;
}

export type SpeechToTextState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'paused'
  | 'processing'
  | 'ready_for_review'
  | 'error';

export interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  maxDurationSeconds?: number;
}

export interface SpeechRecognitionErrorInfo {
  code: 'permission-denied' | 'no-speech' | 'audio-capture' | 'not-allowed' | 'network' | 'unsupported' | 'unknown';
  message: string;
  userGuidance: string;
  fatal: boolean;
}

export interface SpeechToTextCallbacks {
  onStateChange?: (state: SpeechToTextState) => void;
  onInterimTranscript?: (interim: string) => void;
  onFinalTranscript?: (finalChunk: string, fullTranscript: string) => void;
  onAudioLevel?: (level: number, frequencyData?: Uint8Array) => void;
  onPauseDetected?: (pauseSeconds: number) => void;
  onError?: (error: SpeechRecognitionErrorInfo) => void;
}

export interface VoiceDebateRecordingResult {
  transcript: string;
  metrics: SpeechMetrics;
  audioDurationSeconds: number;
  audioBlob?: Blob;
  editedTranscript?: string;
}

/**
 * Replaceable Speech-To-Text Service Interface
 * Allows seamless switching between Web Speech API, Server-side Whisper / Gemini Audio, or Mock STT.
 */
export interface ISpeechToTextService {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  isSupported(): boolean;
  start(options?: SpeechRecognitionOptions, callbacks?: SpeechToTextCallbacks): Promise<void>;
  pause?(): void;
  resume?(): void;
  stop(): Promise<VoiceDebateRecordingResult>;
  cancel(): void;
  isRecording(): boolean;
  getAudioAnalyser(): AnalyserNode | null;
}
