import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Flag,
  ArrowRight,
  RefreshCw,
  Cpu,
  Target,
  FlaskConical,
  Mic,
  Keyboard,
} from 'lucide-react';
import { ActiveDebateState, DebateTurn, CrossQuestionData, CrossAnswerEvaluation } from '../types/debate';
import { SpeechMetrics } from '../types/voice';
import { DebateService } from '../services/debateService';
import { PlayerCard } from '../components/arena/PlayerCard';
import { RoundTimer } from '../components/arena/RoundTimer';
import { ArgumentCard } from '../components/arena/ArgumentCard';
import { HistorySidebar } from '../components/arena/HistorySidebar';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { CrossExaminationChamber } from '../components/arena/CrossExaminationChamber';
import { CrossQuestionLabModal } from '../components/arena/CrossQuestionLabModal';
import { VoiceDebateRecorder } from '../components/voice/VoiceDebateRecorder';

interface DebateArenaPageProps {
  debateState: ActiveDebateState;
  onUpdateDebateState: (updater: (prev: ActiveDebateState) => ActiveDebateState) => void;
  onFinishDebate: () => void;
}

export const DebateArenaPage: React.FC<DebateArenaPageProps> = ({
  debateState,
  onUpdateDebateState,
  onFinishDebate,
}) => {
  const [argumentInput, setArgumentInput] = useState('');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCrossQ, setIsGeneratingCrossQ] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll feed on new arguments
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [debateState.transcript, aiStatusMessage, debateState.activeCrossExam]);

  // Turn Countdown Timer tick
  useEffect(() => {
    if (debateState.status !== 'in_progress' || debateState.activeCrossExam) return;

    const timer = setInterval(() => {
      onUpdateDebateState(prev => {
        if (prev.secondsRemaining <= 1) {
          return {
            ...prev,
            secondsRemaining: prev.turnDuration,
          };
        }
        return {
          ...prev,
          secondsRemaining: prev.secondsRemaining - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [debateState.status, debateState.activeCrossExam, onUpdateDebateState]);

  // Calculate cumulative scores
  let scoreA = 0;
  let scoreB = 0;
  debateState.transcript.forEach(t => {
    if (t.side === 'affirmative') scoreA += t.scores?.total || 0;
    else scoreB += t.scores?.total || 0;
  });

  // Identify latest turns
  const lastOpponentTurn = [...debateState.transcript]
    .reverse()
    .find(t => t.side === 'negative');
  const lastPlayerTurn = [...debateState.transcript]
    .reverse()
    .find(t => t.side === 'affirmative');

  // Trigger Cross-Examination manually or programmatically
  const handleTriggerCrossQuestion = async (explicitPlayerArg?: string, explicitOpponentArg?: string) => {
    setIsGeneratingCrossQ(true);
    setAiStatusMessage('AI Cross-Examiner analyzing dialectical claims, contradictions & fallacies...');

    try {
      const pArg = explicitPlayerArg || lastPlayerTurn?.argumentText || debateState.topic.backgroundContext;
      const oArg = explicitOpponentArg || lastOpponentTurn?.argumentText || 'We demand rigorous empirical proof before accepting this proposition.';

      const previousArgs = debateState.transcript.map(t => ({
        speaker: t.side === 'affirmative' ? 'A' : 'B',
        side: t.side,
        round: t.roundNumber,
        text: t.argumentText,
      }));

      const questionData = await DebateService.generateCrossQuestion(
        debateState.topic.motion,
        pArg,
        oArg,
        previousArgs,
        debateState.currentRound
      );

      onUpdateDebateState(prev => ({
        ...prev,
        liveCrossQuestion: questionData,
        activeCrossExam: {
          questionData,
          status: 'answering',
        },
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCrossQ(false);
      setAiStatusMessage(null);
    }
  };

  // Defense Completed Handler
  const handleDefenseCompleted = (bonusPoints: number, evalData: CrossAnswerEvaluation) => {
    onUpdateDebateState(prev => {
      // Award bonus points to target player's latest turn
      const updatedTranscript = [...prev.transcript];
      const targetSide = prev.activeCrossExam?.questionData.targetPlayer === 'A' ? 'affirmative' : 'negative';
      const targetTurnIndex = [...updatedTranscript].reverse().findIndex(t => t.side === targetSide);

      if (targetTurnIndex !== -1) {
        const actualIndex = updatedTranscript.length - 1 - targetTurnIndex;
        const targetTurn = updatedTranscript[actualIndex];
        if (targetTurn.scores) {
          updatedTranscript[actualIndex] = {
            ...targetTurn,
            scores: {
              ...targetTurn.scores,
              total: targetTurn.scores.total + bonusPoints,
            },
            aiFeedbackSummary: `${targetTurn.aiFeedbackSummary} • Cross-Exam Defense: +${bonusPoints} pts (Grade: ${evalData.grade})`,
          };
        }
      }

      return {
        ...prev,
        transcript: updatedTranscript,
        activeCrossExam: undefined,
      };
    });
  };

  // Submit User Argument Handler (supports both Voice and Text modes)
  const handleSubmitArgument = async (customText?: string, speechMetrics?: SpeechMetrics) => {
    const text = (customText || argumentInput).trim();
    if (!text || isSubmitting) return;

    setArgumentInput('');
    setIsSubmitting(true);
    setAiStatusMessage(
      speechMetrics
        ? 'AI Judge evaluating vocal argument: analyzing speech delivery characteristics, empirical warrants, and dialectical rigor...'
        : 'AI Judge analyzing argument: checking logic, empirical warrants, and fallacies...'
    );

    try {
      // 1. Evaluate User Turn with speech metrics and input mode
      const newTurn = await DebateService.evaluateArgument(
        text,
        debateState.topic,
        debateState.currentRound,
        'affirmative',
        speechMetrics,
        speechMetrics ? 'voice' : 'text'
      );

      onUpdateDebateState(prev => ({
        ...prev,
        transcript: [...prev.transcript, newTurn],
        activeSpeakerSide: 'negative',
        secondsRemaining: prev.turnDuration,
      }));

      // Check if match concludes
      const hasCompletedAllRounds = debateState.currentRound >= debateState.totalRounds;

      // 2. Opponent Counter-Turn
      setAiStatusMessage(`${debateState.playerB.name} is preparing counter-argument...`);
      const opponentTurn = await DebateService.generateOpponentTurn(
        debateState.topic,
        debateState.currentRound,
        debateState.playerB
      );

      onUpdateDebateState(prev => ({
        ...prev,
        transcript: [...prev.transcript, opponentTurn],
        currentRound: hasCompletedAllRounds ? prev.currentRound : prev.currentRound + 1,
        activeSpeakerSide: 'affirmative',
        secondsRemaining: prev.turnDuration,
      }));

      // 3. Summon AI Cross-Examiner
      setAiStatusMessage('AI Cross-Examiner interrogating dialectical vulnerabilities...');
      setTimeout(() => {
        handleTriggerCrossQuestion(text, opponentTurn.argumentText);
      }, 700);
    } catch (err) {
      console.error(err);
      setAiStatusMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUserTurn = debateState.activeSpeakerSide === 'affirmative' && !isSubmitting && !debateState.activeCrossExam;

  return (
    <div className="arena-layout-container">
      {/* 1. TOPIC AT TOP & ARENA MOTION BANNER */}
      <div className="arena-motion-banner">
        <div className="motion-title-block">
          <div className="motion-label">
            Active Motion • {debateState.topic.category} ({debateState.difficulty})
          </div>
          <div className="motion-text">
            "{debateState.topic.motion}"
          </div>
        </div>

        {/* Central Round & Timer HUD */}
        <div className="arena-hud-center">
          <div className="round-status-pill">
            ROUND {debateState.currentRound} OF {debateState.totalRounds}
          </div>
          <RoundTimer secondsRemaining={debateState.secondsRemaining} />

          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
            <Button
              variant="outline"
              size="sm"
              icon={<Cpu size={13} />}
              onClick={() => handleTriggerCrossQuestion()}
              disabled={isGeneratingCrossQ || isSubmitting || !!debateState.activeCrossExam}
              title="Summon the AI Cross-Examiner to interrogate current arguments"
            >
              {isGeneratingCrossQ ? 'Interrogating...' : 'Cross-Examine'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FlaskConical size={13} />}
              onClick={() => setShowLabModal(true)}
              title="Open AI Cross-Question API Playground & Inspection Lab"
            >
              API Lab
            </Button>
          </div>
        </div>
      </div>

      {/* 2. MAIN BATTLE ARENA GRID */}
      <div className="arena-main-grid">
        {/* Left Column: Player A Panel (Affirmative - Human) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <PlayerCard
            player={debateState.playerA}
            side="affirmative"
            isActiveTurn={debateState.activeSpeakerSide === 'affirmative' && !debateState.activeCrossExam}
            score={scoreA}
            maxScore={debateState.totalRounds * 100}
          />
        </div>

        {/* Center Column: Argument Feed, AI Status, Cross-Exam Chamber & Input */}
        <div className="arena-center-stage">
          {/* Active AI Cross-Examination Chamber */}
          <AnimatePresence>
            {debateState.activeCrossExam && (
              <CrossExaminationChamber
                questionData={debateState.activeCrossExam.questionData}
                topicMotion={debateState.topic.motion}
                roundNumber={debateState.currentRound}
                playerAName={debateState.playerA.name}
                playerBName={debateState.playerB.name}
                onDefenseCompleted={handleDefenseCompleted}
                onDismiss={() => {
                  onUpdateDebateState(prev => ({ ...prev, activeCrossExam: undefined }));
                }}
              />
            )}
          </AnimatePresence>

          {/* Argument Stream Feed */}
          <div className="argument-feed-container">
            {debateState.transcript.map((turn, idx) => (
              <ArgumentCard key={`${turn.speakerId}_${turn.roundNumber}_${idx}`} turn={turn} />
            ))}

            {/* AI Status Indicator Live Pill */}
            {aiStatusMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="ai-status-indicator"
              >
                <div className="ai-pulse-dot" />
                <Cpu size={16} />
                <span>{aiStatusMessage}</span>
              </motion.div>
            )}

            <div ref={feedEndRef} />
          </div>

          {/* Rebuttal Target Helper if Opponent spoke */}
          {lastOpponentTurn && isUserTurn && !debateState.activeCrossExam && (
            <div
              style={{
                background: 'rgba(255, 51, 102, 0.08)',
                borderLeft: '3px solid var(--crimson-red)',
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
                color: '#ffb3c1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong>Rebuttal Target:</strong> Addressing {lastOpponentTurn.speakerName}'s claim: "
                {lastOpponentTurn.argumentText.slice(0, 110)}..."
              </div>
              <Badge variant="crimson">Rebuttal Phase</Badge>
            </div>
          )}

          {/* Input Chamber */}
          <Card className="arena-input-chamber" variant="cyan">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-hud)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {inputMode === 'voice' ? <Mic size={16} style={{ color: 'var(--cyber-cyan)' }} /> : <Send size={15} style={{ color: 'var(--cyber-cyan)' }} />}
                  <span>Argument Synthesis Chamber</span>
                </div>

                {/* Input Mode Toggle */}
                <div
                  style={{
                    display: 'flex',
                    background: 'var(--bg-surface-3)',
                    padding: '2px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    onClick={() => setInputMode('voice')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-hud)',
                      background: inputMode === 'voice' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                      color: inputMode === 'voice' ? 'var(--cyber-cyan)' : 'var(--text-muted)',
                      border: inputMode === 'voice' ? '1px solid var(--cyber-cyan)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Mic size={12} />
                    <span>Voice Mode</span>
                  </button>
                  <button
                    onClick={() => setInputMode('text')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-hud)',
                      background: inputMode === 'text' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                      color: inputMode === 'text' ? 'var(--cyber-cyan)' : 'var(--text-muted)',
                      border: inputMode === 'text' ? '1px solid var(--cyber-cyan)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Keyboard size={12} />
                    <span>Keyboard</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {inputMode === 'text' && (
                  <span className="char-counter">{argumentInput.length} characters</span>
                )}
                <Badge variant={isUserTurn ? 'cyan' : 'default'}>
                  {debateState.activeCrossExam
                    ? 'Cross-Examination Active'
                    : isUserTurn
                    ? 'Your Turn to Clash'
                    : 'Awaiting Opponent'}
                </Badge>
              </div>
            </div>

            {/* Voice Mode View */}
            {inputMode === 'voice' ? (
              <VoiceDebateRecorder
                disabled={!isUserTurn}
                maxDurationSeconds={120}
                topicMotion={debateState.topic.motion}
                placeholderPrompt="Tap record and speak your argument. Address the motion, refute your opponent's points, cite evidence, and submit for multi-criteria AI evaluation."
                onArgumentSubmitted={(spokenText, metrics) => {
                  handleSubmitArgument(spokenText, metrics);
                }}
                onCancelToKeyboard={() => setInputMode('text')}
              />
            ) : (
              /* Keyboard Mode View */
              <>
                <textarea
                  className="argument-textarea"
                  placeholder={
                    debateState.activeCrossExam
                      ? 'AI Cross-Examination is currently active above. Address the interrogation question directly.'
                      : isUserTurn
                      ? 'Construct your argument. Frame your premises, cite evidence, directly refute your opponent, and maintain logical rigor...'
                      : 'Opponent or AI Judge is currently active. Formulate your upcoming rebuttal...'
                  }
                  value={argumentInput}
                  onChange={e => setArgumentInput(e.target.value)}
                  disabled={!isUserTurn}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSubmitArgument();
                    }
                  }}
                />

                <div className="input-actions-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>💡 Shortcut: <strong>Ctrl + Enter</strong> to submit</span>
                    <span>• AI Judge evaluates logic, relevance, fallacies</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button
                      variant="outline"
                      icon={<Mic size={14} />}
                      onClick={() => setInputMode('voice')}
                    >
                      Use Voice Mode
                    </Button>

                    <Button
                      variant="primary"
                      icon={<Send size={16} />}
                      onClick={() => handleSubmitArgument()}
                      disabled={!isUserTurn || argumentInput.trim().length < 30}
                    >
                      {isSubmitting ? 'Evaluating...' : 'SUBMIT ARGUMENT'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={onFinishDebate}
                      title="Conclude match early and compile verdict dossier"
                    >
                      View Verdict
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Right Column: Player B Panel & History Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <PlayerCard
            player={debateState.playerB}
            side="negative"
            isActiveTurn={debateState.activeSpeakerSide === 'negative'}
            score={scoreB}
            maxScore={debateState.totalRounds * 100}
          />

          <HistorySidebar
            transcript={debateState.transcript}
            totalRounds={debateState.totalRounds}
            currentRound={debateState.currentRound}
          />
        </div>
      </div>

      {/* Cross-Question API Lab Modal */}
      <CrossQuestionLabModal
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
        defaultTopic={debateState.topic.motion}
        defaultPlayerArgument={lastPlayerTurn?.argumentText}
        defaultOpponentArgument={lastOpponentTurn?.argumentText}
      />
    </div>
  );
};
