import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Send,
  Sparkles,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Cpu,
  RefreshCw,
  ChevronRight,
  Target,
} from 'lucide-react';
import { CrossQuestionData, CrossAnswerEvaluation } from '../../types/debate';
import { DebateService } from '../../services/debateService';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface CrossExaminationChamberProps {
  questionData: CrossQuestionData;
  topicMotion: string;
  roundNumber: number;
  playerAName: string;
  playerBName: string;
  onDefenseCompleted: (scoreEarned: number, evalData: CrossAnswerEvaluation) => void;
  onDismiss?: () => void;
}

export const CrossExaminationChamber: React.FC<CrossExaminationChamberProps> = ({
  questionData,
  topicMotion,
  roundNumber,
  playerAName,
  playerBName,
  onDefenseCompleted,
  onDismiss,
}) => {
  const [defenseText, setDefenseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<CrossAnswerEvaluation | null>(null);

  const isPlayerATarget = questionData.targetPlayer === 'A';
  const targetName = isPlayerATarget ? playerAName : playerBName;

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'extreme':
        return <Badge variant="crimson"><Flame size={12} className="inline mr-1" /> EXTREME (ROUND {roundNumber})</Badge>;
      case 'hard':
        return <Badge variant="gold"><AlertTriangle size={12} className="inline mr-1" /> HARD (ROUND {roundNumber})</Badge>;
      default:
        return <Badge variant="cyan"><ShieldCheck size={12} className="inline mr-1" /> MODERATE (ROUND {roundNumber})</Badge>;
    }
  };

  const handleSubmitDefense = async () => {
    if (!defenseText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const evalResult = await DebateService.evaluateCrossAnswer(
        topicMotion,
        questionData.question,
        questionData.reason,
        defenseText.trim(),
        questionData.targetPlayer,
        roundNumber
      );
      setEvaluation(evalResult);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateOpponentDefense = async () => {
    setIsSubmitting(true);
    try {
      const simulatedText = `To directly refute the inquiry: our operational architecture enforces cryptographic telemetry logging under Article 36 of the Geneva Conventions, preventing automated decision drift through verifiable hardware security modules. We resolve the alleged paradox by restricting autonomous engagement strictly to hypersonic defensive counter-battery interceptions where human latency creates catastrophic vulnerability.`;
      setDefenseText(simulatedText);
      const evalResult = await DebateService.evaluateCrossAnswer(
        topicMotion,
        questionData.question,
        questionData.reason,
        simulatedText,
        'B',
        roundNumber
      );
      setEvaluation(evalResult);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="cross-exam-card"
      style={{
        background: 'linear-gradient(180deg, rgba(16, 24, 39, 0.98) 0%, rgba(10, 15, 29, 0.98) 100%)',
        border: '1px solid rgba(0, 240, 255, 0.35)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 240, 255, 0.15)',
        borderRadius: '12px',
        padding: '1.5rem',
        margin: '1.25rem 0',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ background: 'rgba(0, 240, 255, 0.15)', padding: '0.4rem', borderRadius: '8px', color: 'var(--cyber-cyan)' }}>
            <Cpu size={20} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-hud)', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.05em', color: '#fff' }}>
              AI GRANDMASTER CROSS-EXAMINATION
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Dialectical interrogation probing rhetorical warrants, contradictions, and fallacies
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getDifficultyBadge(questionData.difficulty)}
          <Badge variant={isPlayerATarget ? 'cyan' : 'crimson'}>
            <Target size={12} className="inline mr-1" />
            TARGET: {isPlayerATarget ? `${playerAName} (You)` : playerBName}
          </Badge>
        </div>
      </div>

      {/* Vulnerability Reason Callout */}
      <div
        style={{
          background: 'rgba(255, 179, 0, 0.08)',
          borderLeft: '4px solid #ffb300',
          padding: '0.85rem 1rem',
          borderRadius: '4px',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#ffca28', letterSpacing: '0.05em' }}>
          <AlertTriangle size={14} />
          <span>Dialectical Vulnerability Detected • {questionData.vulnerabilityType || 'Structural Flaw'}</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.86rem', color: '#ffecb3', lineHeight: 1.45 }}>
          {questionData.reason}
        </p>
      </div>

      {/* The Socratic Question */}
      <div
        style={{
          background: 'rgba(0, 240, 255, 0.05)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          position: 'relative',
        }}
      >
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--cyber-cyan)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Interrogation Challenge:
        </div>
        <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#f0f9ff', lineHeight: 1.5, fontStyle: 'italic' }}>
          "{questionData.question}"
        </p>
      </div>

      {/* Defense Interaction Section */}
      {!evaluation ? (
        <div>
          {isPlayerATarget ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e0e7ff' }}>
                  Your Cross-Examination Defense:
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {defenseText.length} chars • Cite data & resolve the exposed flaw
                </span>
              </div>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '100px',
                  background: 'rgba(6, 10, 20, 0.85)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  marginBottom: '0.75rem',
                }}
                placeholder="Directly confront the question. Clarify your premise, cite empirical evidence, and defend against the vulnerability..."
                value={defenseText}
                onChange={e => setDefenseText(e.target.value)}
                disabled={isSubmitting}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                {onDismiss && (
                  <Button variant="outline" onClick={onDismiss} disabled={isSubmitting}>
                    Skip Cross-Exam
                  </Button>
                )}
                <Button
                  variant="primary"
                  icon={<Send size={15} />}
                  onClick={handleSubmitDefense}
                  disabled={isSubmitting || defenseText.trim().length < 20}
                >
                  {isSubmitting ? 'Scoring Defense...' : 'SUBMIT DEFENSE FOR SCORING'}
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255, 51, 102, 0.05)', border: '1px solid rgba(255, 51, 102, 0.2)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#ffb3c1' }}>
                {playerBName} has been summoned to the cross-examination podium to defend against this challenge.
              </p>
              <Button
                variant="primary"
                icon={<RefreshCw size={15} />}
                onClick={handleSimulateOpponentDefense}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Evaluating Defense...' : `TRIGGER ${playerBName.toUpperCase()}'S DEFENSE`}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Evaluation Results Display */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(10, 20, 35, 0.95)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '8px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: evaluation.passed ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                  border: `2px solid ${evaluation.passed ? 'var(--cyber-cyan)' : 'var(--crimson-red)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-hud)',
                }}
              >
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: evaluation.passed ? 'var(--cyber-cyan)' : 'var(--crimson-red)' }}>
                  {evaluation.score}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#aaa' }}>/ 100</span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                    Grade: {evaluation.grade}
                  </span>
                  <Badge variant={evaluation.passed ? 'cyan' : 'crimson'}>
                    {evaluation.passed ? 'DEFENSE SUSTAINED' : 'DEFENSE FAILED'}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Vulnerability Addressed: {evaluation.vulnerabilityAddressed ? 'Yes (Mitigated)' : 'No (Remains Exposed)'}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              icon={<ChevronRight size={16} />}
              onClick={() => onDefenseCompleted(Math.round(evaluation.score * 0.25), evaluation)}
            >
              ACCEPT & RESUME ARENA (+{Math.round(evaluation.score * 0.25)} PTS)
            </Button>
          </div>

          {/* 5-Criteria Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Directness</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0f2fe' }}>{evaluation.breakdown.directness} / 20</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Counter-Evidence</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0f2fe' }}>{evaluation.breakdown.counterEvidence} / 20</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Consistency</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0f2fe' }}>{evaluation.breakdown.logicalConsistency} / 20</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rebuttal Clarity</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0f2fe' }}>{evaluation.breakdown.rebuttalClarity} / 20</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Defense Depth</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0f2fe' }}>{evaluation.breakdown.defenseDepth} / 20</div>
            </div>
          </div>

          {/* Adjudicator Feedback */}
          <div style={{ background: 'rgba(0, 240, 255, 0.04)', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#e0f2fe', lineHeight: 1.45 }}>
            <strong>Adjudicator Feedback:</strong> {evaluation.feedback}
          </div>

          {/* Strengths & Weaknesses list */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
            {evaluation.strengths.length > 0 && (
              <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '0.6rem 0.8rem', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>
                <span style={{ fontWeight: 700, color: '#6ee7b7' }}>Key Strengths:</span>
                <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, color: '#a7f3d0' }}>
                  {evaluation.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.weaknesses.length > 0 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '0.6rem 0.8rem', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
                <span style={{ fontWeight: 700, color: '#fca5a5' }}>Areas to Fortify:</span>
                <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, color: '#fecaca' }}>
                  {evaluation.weaknesses.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
