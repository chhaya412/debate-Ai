import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Edit3,
  Clock,
  Volume2,
  Keyboard,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  ISpeechToTextService,
  SpeechMetrics,
  SpeechRecognitionErrorInfo,
  SpeechToTextState,
  VoiceDebateRecordingResult,
} from '../../types/voice';
import { SpeechServiceManager } from '../../services/speech/speechServiceManager';
import { AudioVisualizer } from './AudioVisualizer';
import { SpeechMetricsCard } from './SpeechMetricsCard';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface VoiceDebateRecorderProps {
  onArgumentSubmitted: (argumentText: string, speechMetrics?: SpeechMetrics) => void;
  onCancelToKeyboard?: () => void;
  disabled?: boolean;
  maxDurationSeconds?: number;
  placeholderPrompt?: string;
  topicMotion?: string;
}

export const VoiceDebateRecorder: React.FC<VoiceDebateRecorderProps> = ({
  onArgumentSubmitted,
  onCancelToKeyboard,
  disabled = false,
  maxDurationSeconds = 120, // 2 minutes max per turn
  placeholderPrompt = 'Speak clearly into your microphone. Frame your premises, cite empirical evidence, and rebut your opponent...',
  topicMotion,
}) => {
  const [recorderState, setRecorderState] = useState<SpeechToTextState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [liveInterimText, setLiveInterimText] = useState('');
  const [liveFinalTranscript, setLiveFinalTranscript] = useState('');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [analyzedMetrics, setAnalyzedMetrics] = useState<SpeechMetrics | null>(null);
  const [currentAudioLevel, setCurrentAudioLevel] = useState(0);
  const [errorInfo, setErrorInfo] = useState<SpeechRecognitionErrorInfo | null>(null);
  const [showEngineSelector, setShowEngineSelector] = useState(false);
  const [activeEngineId, setActiveEngineId] = useState<string>('');

  const speechManager = useRef(SpeechServiceManager.getInstance());
  const activeServiceRef = useRef<ISpeechToTextService>(speechManager.current.getActiveService());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync active engine id
  useEffect(() => {
    setActiveEngineId(speechManager.current.getActiveService().id);
  }, []);

  // Timer ticker
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setElapsedSeconds(0);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        if (prev + 1 >= maxDurationSeconds) {
          // Max duration reached, auto-stop recording
          handleStopRecording();
          return maxDurationSeconds;
        }
        return prev + 1;
      });
    }, 1000);
  }, [maxDurationSeconds]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      activeServiceRef.current?.cancel();
    };
  }, [stopTimer]);

  // Format MM:SS
  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  // Start Voice Recording
  const handleStartRecording = async () => {
    if (disabled) return;
    setErrorInfo(null);
    setLiveInterimText('');
    setLiveFinalTranscript('');
    setEditableTranscript('');
    setAnalyzedMetrics(null);

    const service = speechManager.current.getActiveService();
    activeServiceRef.current = service;

    try {
      await service.start(
        {
          continuous: true,
          interimResults: true,
          maxDurationSeconds,
        },
        {
          onStateChange: (state: SpeechToTextState) => {
            setRecorderState(state);
            if (state === 'listening') {
              startTimer();
            } else if (state === 'processing' || state === 'ready_for_review') {
              stopTimer();
            }
          },
          onInterimTranscript: (interim: string) => {
            setLiveInterimText(interim);
          },
          onFinalTranscript: (_finalChunk: string, fullTranscript: string) => {
            setLiveFinalTranscript(fullTranscript);
          },
          onAudioLevel: (level: number) => {
            setCurrentAudioLevel(level);
          },
          onError: (err: SpeechRecognitionErrorInfo) => {
            console.warn('Voice Debate Recorder error:', err);
            if (err.fatal) {
              setErrorInfo(err);
              setRecorderState('error');
              stopTimer();
            }
          },
        }
      );
    } catch (err: any) {
      console.error('Failed to initiate voice recording:', err);
      setErrorInfo({
        code: 'permission-denied',
        message: err.message || 'Microphone initiation failed',
        userGuidance: 'Ensure microphone permissions are allowed in your browser settings.',
        fatal: true,
      });
      setRecorderState('error');
      stopTimer();
    }
  };

  // Stop Recording & Transition to Review/Edit Mode
  const handleStopRecording = async () => {
    stopTimer();
    setRecorderState('processing');

    try {
      const result: VoiceDebateRecordingResult = await activeServiceRef.current.stop();
      const finalCleanTranscript = result.transcript.trim();

      if (!finalCleanTranscript) {
        setErrorInfo({
          code: 'no-speech',
          message: 'No speech was recognized during the recording.',
          userGuidance: 'Check that your microphone is unmuted, speak closer to the mic, and try again.',
          fatal: false,
        });
        setRecorderState('idle');
        return;
      }

      setEditableTranscript(finalCleanTranscript);
      setAnalyzedMetrics(result.metrics);
      setRecorderState('ready_for_review');

      // Focus editable textarea for smooth keyboard refinement
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    } catch (err: any) {
      console.error('Error stopping recording:', err);
      setErrorInfo({
        code: 'unknown',
        message: err.message || 'Failed to complete speech processing.',
        userGuidance: 'Please retry recording or switch to keyboard input.',
        fatal: false,
      });
      setRecorderState('idle');
    }
  };

  // Cancel recording and reset
  const handleCancel = () => {
    stopTimer();
    activeServiceRef.current.cancel();
    setRecorderState('idle');
    setLiveInterimText('');
    setLiveFinalTranscript('');
    setEditableTranscript('');
    setAnalyzedMetrics(null);
    setErrorInfo(null);
  };

  // Final submission of edited transcript into debate engine
  const handleSubmitSpokenArgument = () => {
    const finalArgument = editableTranscript.trim();
    if (!finalArgument || finalArgument.length < 20) {
      alert('Spoken argument must be at least 20 characters before submitting.');
      return;
    }

    onArgumentSubmitted(finalArgument, analyzedMetrics || undefined);
    // Reset state for next round
    setRecorderState('idle');
    setEditableTranscript('');
    setAnalyzedMetrics(null);
  };

  // Switch STT Service
  const handleSelectEngine = (serviceId: string) => {
    speechManager.current.setActiveService(serviceId);
    setActiveEngineId(serviceId);
    activeServiceRef.current = speechManager.current.getActiveService();
    setShowEngineSelector(false);
  };

  const availableServices = speechManager.current.getAvailableServices();

  return (
    <div
      style={{
        background: 'rgba(16, 21, 30, 0.95)',
        border: '1px solid var(--border-focus)',
        borderRadius: '10px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        position: 'relative',
      }}
    >
      {/* Voice HUD Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: recorderState === 'listening' ? 'rgba(255, 51, 102, 0.2)' : 'rgba(0, 240, 255, 0.1)',
              border: `1px solid ${recorderState === 'listening' ? 'var(--neon-crimson)' : 'var(--cyber-cyan)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mic
              size={18}
              color={recorderState === 'listening' ? 'var(--neon-crimson)' : 'var(--cyber-cyan)'}
              className={recorderState === 'listening' ? 'animate-pulse' : ''}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: '#fff' }}>
                Voice Debate Terminal
              </span>
              <Badge variant={recorderState === 'listening' ? 'crimson' : 'cyan'}>
                {recorderState === 'listening'
                  ? 'LIVE CAPTURE'
                  : recorderState === 'ready_for_review'
                  ? 'REVIEW & SUBMIT'
                  : 'VOICE READY'}
              </Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Speech-to-Text Pipeline • Multi-Criteria AI Judging
            </div>
          </div>
        </div>

        {/* Right HUD: Timer & STT Service Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Recording Timer */}
          {(recorderState === 'listening' || recorderState === 'processing') && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontFamily: 'var(--font-hud)',
                fontSize: '1rem',
                color: elapsedSeconds >= maxDurationSeconds - 15 ? 'var(--neon-crimson)' : 'var(--cyber-cyan)',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 240, 255, 0.3)',
              }}
            >
              <Clock size={14} className={recorderState === 'listening' ? 'animate-pulse' : ''} />
              <span>{formatTime(elapsedSeconds)} / {formatTime(maxDurationSeconds)}</span>
            </div>
          )}

          {/* Engine Selector Dropdown Toggle */}
          <button
            onClick={() => setShowEngineSelector(!showEngineSelector)}
            title="Configure Speech-to-Text Service Engine"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            <Settings size={13} />
            <span>STT: {activeEngineId === 'web-speech-api' ? 'Web Speech API' : 'Fallback Engine'}</span>
          </button>

          {/* Cancel / Switch to Keyboard */}
          {onCancelToKeyboard && (
            <button
              onClick={() => {
                handleCancel();
                onCancelToKeyboard();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer',
              }}
              title="Switch to typing text"
            >
              <Keyboard size={14} />
              <span>Text Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* STT Service Engine Selection Drawer */}
      <AnimatePresence>
        {showEngineSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'var(--bg-surface-3)',
              border: '1px solid var(--border-focus)',
              borderRadius: '6px',
              padding: '0.85rem',
              overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
              Replaceable Speech-to-Text Engine Abstraction
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
              {availableServices.map(engine => (
                <div
                  key={engine.id}
                  onClick={() => handleSelectEngine(engine.id)}
                  style={{
                    background: engine.id === activeEngineId ? 'rgba(0, 240, 255, 0.12)' : 'var(--bg-surface-2)',
                    border: `1px solid ${engine.id === activeEngineId ? 'var(--cyber-cyan)' : 'var(--border-subtle)'}`,
                    borderRadius: '6px',
                    padding: '0.65rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: engine.id === activeEngineId ? 'var(--cyber-cyan)' : '#fff' }}>
                      {engine.name}
                    </span>
                    {engine.id === activeEngineId && <CheckCircle2 size={14} color="var(--cyber-cyan)" />}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {engine.description}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      {errorInfo && (
        <div
          style={{
            background: 'rgba(255, 51, 102, 0.12)',
            border: '1px solid var(--neon-crimson)',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <AlertTriangle size={18} color="var(--neon-crimson)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              {errorInfo.message}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.25rem' }}>
              {errorInfo.userGuidance}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setErrorInfo(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* STATE 1: IDLE / READY TO RECORD */}
      {recorderState === 'idle' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.25rem 1.5rem',
            gap: '1.25rem',
            textAlign: 'center',
            background: 'rgba(10, 14, 22, 0.6)',
            borderRadius: '8px',
            border: '1px dashed rgba(0, 240, 255, 0.25)',
          }}
        >
          {/* Big Tactile Record Button */}
          <button
            onClick={handleStartRecording}
            disabled={disabled}
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: disabled
                ? 'var(--bg-surface-3)'
                : 'radial-gradient(circle, #00f0ff 0%, #0088cc 100%)',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              boxShadow: disabled
                ? 'none'
                : '0 0 25px rgba(0, 240, 255, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            title="Start Recording Spoken Argument"
          >
            <Mic size={36} color="#0a0e16" />
          </button>

          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              Tap to Speak Your Debate Argument
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0.4rem auto 0' }}>
              {placeholderPrompt}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>🎙️ Up to {maxDurationSeconds}s turn length</span>
            <span>• ⚡ Live transcription</span>
            <span>• 📝 Edit before submission</span>
          </div>
        </div>
      )}

      {/* STATE 2: LIVE RECORDING IN PROGRESS */}
      {recorderState === 'listening' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Real-time Audio Visualizer */}
          <AudioVisualizer
            analyserNode={activeServiceRef.current.getAudioAnalyser()}
            isRecording={true}
            audioLevel={currentAudioLevel}
            height={64}
          />

          {/* Live Streaming Transcript Window */}
          <div
            style={{
              minHeight: '90px',
              maxHeight: '140px',
              overflowY: 'auto',
              background: 'var(--bg-surface-3)',
              border: '1px solid var(--border-focus)',
              borderRadius: '6px',
              padding: '0.85rem 1rem',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: '#fff',
            }}
          >
            {liveFinalTranscript && <span>{liveFinalTranscript} </span>}
            {liveInterimText && (
              <span style={{ color: 'var(--cyber-cyan)', fontStyle: 'italic', opacity: 0.9 }}>
                {liveInterimText}
              </span>
            )}
            {!liveFinalTranscript && !liveInterimText && (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Listening to your voice... Speak your points now.
              </span>
            )}
          </div>

          {/* Recording Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--neon-crimson)',
                  boxShadow: '0 0 8px var(--neon-crimson)',
                }}
                className="animate-pulse"
              />
              <span>Live microphone active</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<Square size={14} />}
                onClick={handleStopRecording}
                style={{
                  background: 'linear-gradient(135deg, #ff3366 0%, #ff5500 100%)',
                  border: 'none',
                  boxShadow: '0 0 15px rgba(255, 51, 102, 0.4)',
                }}
              >
                FINISH & REVIEW TRANSCRIPT
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: PROCESSING AUDIO */}
      {recorderState === 'processing' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.5rem 1.5rem',
            gap: '1rem',
          }}
        >
          <RefreshCw size={28} color="var(--cyber-cyan)" className="animate-spin" />
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.95rem', color: '#fff' }}>
            Finalizing Speech-to-Text & Analyzing Pacing Characteristics...
          </div>
        </div>
      )}

      {/* STATE 4: REVIEW & EDIT TRANSCRIPT BEFORE SUBMITTING */}
      {recorderState === 'ready_for_review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Transcript Edit Chamber */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                <Edit3 size={15} color="var(--cyber-cyan)" />
                <span>Transcript Preview & Refinement</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {editableTranscript.length} chars • {editableTranscript.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              ref={textareaRef}
              className="argument-textarea"
              style={{
                minHeight: '120px',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                padding: '0.85rem',
                border: '1px solid var(--cyber-cyan)',
                borderRadius: '6px',
                background: 'var(--bg-surface-3)',
                color: '#fff',
              }}
              value={editableTranscript}
              onChange={e => setEditableTranscript(e.target.value)}
              placeholder="Refine and edit your transcribed argument before sending to the AI Adjudicator..."
            />

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>💡 You can directly edit any misheard words or add empirical citations before submitting.</span>
            </div>
          </div>

          {/* Speech Characteristics Telemetry Card (Speed, Pauses, Fillers, Clarity) */}
          {analyzedMetrics && (
            <SpeechMetricsCard metrics={analyzedMetrics} />
          )}

          {/* Action Submission Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={handleStartRecording}
                title="Discard this recording and speak again"
              >
                Re-record
              </Button>
              {onCancelToKeyboard && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancelToKeyboard}
                >
                  Use Keyboard
                </Button>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              icon={<Send size={18} />}
              onClick={handleSubmitSpokenArgument}
              disabled={editableTranscript.trim().length < 20}
              style={{
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
              }}
            >
              SUBMIT SPOKEN ARGUMENT
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
