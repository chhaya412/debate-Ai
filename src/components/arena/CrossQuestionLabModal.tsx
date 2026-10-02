import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Cpu,
  Send,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Code2,
  RefreshCw,
  Target,
  ArrowRight,
} from 'lucide-react';
import { CrossQuestionData, CrossAnswerEvaluation } from '../../types/debate';
import { DebateService } from '../../services/debateService';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface CrossQuestionLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopic?: string;
  defaultPlayerArgument?: string;
  defaultOpponentArgument?: string;
}

export const CrossQuestionLabModal: React.FC<CrossQuestionLabModalProps> = ({
  isOpen,
  onClose,
  defaultTopic = 'This House would establish a binding international treaty banning fully autonomous lethal weapon systems.',
  defaultPlayerArgument = 'Delegating lethal targeting to algorithmic neural networks creates an accountability void. Under Article 36 of the Geneva Conventions, states are strictly obligated to assess whether new weapon technologies cause indiscriminate effects.',
  defaultOpponentArgument = 'Autonomous targeting algorithms execute defensive countermeasures at microsecond intervals, drastically reducing human combat panic and error.',
}) => {
  const [topic, setTopic] = useState(defaultTopic);
  const [playerArgument, setPlayerArgument] = useState(defaultPlayerArgument);
  const [opponentArgument, setOpponentArgument] = useState(defaultOpponentArgument);
  const [round, setRound] = useState<number>(2);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<CrossQuestionData | null>(null);
  const [rawQuestionJson, setRawQuestionJson] = useState<string | null>(null);

  const [answerInput, setAnswerInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<CrossAnswerEvaluation | null>(null);
  const [rawAnswerJson, setRawAnswerJson] = useState<string | null>(null);

  const [showRawJson, setShowRawJson] = useState(false);

  if (!isOpen) return null;

  const handleGenerateQuestion = async () => {
    setIsGenerating(true);
    setEvaluationResult(null);
    setRawAnswerJson(null);

    try {
      const response = await fetch('/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          playerArgument,
          opponentArgument,
          previousArguments: [],
          round,
        }),
      });

      const data = await response.json();
      setGeneratedQuestion(data);
      setRawQuestionJson(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!generatedQuestion || !answerInput.trim()) return;

    setIsEvaluating(true);
    try {
      const response = await fetch('/evaluate-cross-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          question: generatedQuestion.question,
          questionReason: generatedQuestion.reason,
          answer: answerInput.trim(),
          targetPlayer: generatedQuestion.targetPlayer,
          round,
        }),
      });

      const data = await response.json();
      setEvaluationResult(data);
      setRawAnswerJson(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #0d1527 0%, #060a14 100%)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 240, 255, 0.2)',
          padding: '1.75rem',
          color: '#fff',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(0, 240, 255, 0.15)', padding: '0.5rem', borderRadius: '8px', color: 'var(--cyber-cyan)' }}>
              <Cpu size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-hud)', fontWeight: 800, letterSpacing: '0.05em' }}>
                AI CROSS-QUESTION SYSTEM LAB
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Direct API endpoint testing for POST /generate-question and POST /evaluate-cross-answer
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="sm"
              icon={<Code2 size={14} />}
              onClick={() => setShowRawJson(!showRawJson)}
            >
              {showRawJson ? 'Hide Raw JSON' : 'View API JSON'}
            </Button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                padding: '0.4rem',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Input Configuration Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyber-cyan)', marginBottom: '0.35rem' }}>
              Debate Topic / Motion
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '0.6rem 0.8rem',
                color: '#fff',
                fontSize: '0.88rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#e0e7ff', marginBottom: '0.35rem' }}>
              Player Argument (Side A)
            </label>
            <textarea
              rows={3}
              value={playerArgument}
              onChange={e => setPlayerArgument(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '0.6rem 0.8rem',
                color: '#fff',
                fontSize: '0.85rem',
                lineHeight: 1.4,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#ffb3c1', marginBottom: '0.35rem' }}>
              Opponent Argument (Side B)
            </label>
            <textarea
              rows={3}
              value={opponentArgument}
              onChange={e => setOpponentArgument(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '0.6rem 0.8rem',
                color: '#fff',
                fontSize: '0.85rem',
                lineHeight: 1.4,
              }}
            />
          </div>
        </div>

        {/* Round & Generate Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              DEBATE ROUND (DIFFICULTY SCALING):
            </span>
            {[1, 2, 3].map(r => (
              <button
                key={r}
                onClick={() => setRound(r)}
                style={{
                  background: round === r ? 'var(--cyber-cyan)' : 'rgba(255, 255, 255, 0.08)',
                  color: round === r ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Round {r} ({r === 1 ? 'Moderate' : r === 2 ? 'Hard' : 'Extreme'})
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            icon={<Sparkles size={16} />}
            onClick={handleGenerateQuestion}
            disabled={isGenerating}
          >
            {isGenerating ? 'Analyzing Arguments...' : 'EXECUTE POST /generate-question'}
          </Button>
        </div>

        {/* Generated Question Display */}
        {generatedQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(0, 240, 255, 0.05)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '8px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Badge variant={generatedQuestion.targetPlayer === 'A' ? 'cyan' : 'crimson'}>
                  <Target size={12} className="inline mr-1" />
                  Target Player: {generatedQuestion.targetPlayer}
                </Badge>
                <Badge variant="gold">
                  Difficulty: {generatedQuestion.difficulty.toUpperCase()}
                </Badge>
                {generatedQuestion.vulnerabilityType && (
                  <Badge variant="default">
                    {generatedQuestion.vulnerabilityType.toUpperCase()}
                  </Badge>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Generated for Round {round}
              </span>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Dialectical Reason / Flaw Detected:
              </div>
              <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#fef08a' }}>
                {generatedQuestion.reason}
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem 1rem', borderRadius: '6px', borderLeft: '3px solid var(--cyber-cyan)' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--cyber-cyan)', fontWeight: 800 }}>
                AI Cross-Examination Question:
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.98rem', fontWeight: 600, color: '#fff', fontStyle: 'italic' }}>
                "{generatedQuestion.question}"
              </p>
            </div>

            {/* Answering Section */}
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#e0e7ff', marginBottom: '0.35rem' }}>
                Player Defense Response (Testing POST /evaluate-cross-answer):
              </label>
              <textarea
                rows={3}
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                placeholder="Type a defense tackling the question directly, citing empirical data and addressing the underlying flaw..."
                style={{
                  width: '100%',
                  background: 'rgba(6, 10, 20, 0.85)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '0.6rem 0.8rem',
                  color: '#fff',
                  fontSize: '0.85rem',
                  marginBottom: '0.5rem',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Evaluates: Directness, Evidence, Consistency, Rebuttal, Defense Depth
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Send size={14} />}
                  onClick={handleEvaluateAnswer}
                  disabled={isEvaluating || !answerInput.trim()}
                >
                  {isEvaluating ? 'Evaluating...' : 'EVALUATE ANSWER'}
                </Button>
              </div>
            </div>

            {/* Evaluation Breakdown */}
            {evaluationResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: '1.25rem',
                  background: 'rgba(10, 18, 30, 0.95)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--cyber-cyan)' }}>
                      Score: {evaluationResult.score}/100
                    </span>
                    <Badge variant={evaluationResult.passed ? 'cyan' : 'crimson'}>
                      Grade: {evaluationResult.grade} ({evaluationResult.passed ? 'PASSED' : 'FAILED'})
                    </Badge>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Vulnerability Mitigated: {evaluationResult.vulnerabilityAddressed ? 'Yes' : 'No'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Directness</div>
                    <div style={{ fontWeight: 700 }}>{evaluationResult.breakdown.directness}/20</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Evidence</div>
                    <div style={{ fontWeight: 700 }}>{evaluationResult.breakdown.counterEvidence}/20</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Consistency</div>
                    <div style={{ fontWeight: 700 }}>{evaluationResult.breakdown.logicalConsistency}/20</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Rebuttal</div>
                    <div style={{ fontWeight: 700 }}>{evaluationResult.breakdown.rebuttalClarity}/20</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Depth</div>
                    <div style={{ fontWeight: 700 }}>{evaluationResult.breakdown.defenseDepth}/20</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#e0f2fe', background: 'rgba(0, 240, 255, 0.05)', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                  <strong>Feedback:</strong> {evaluationResult.feedback}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Raw JSON Debugging Panel */}
        {showRawJson && (
          <div style={{ marginTop: '1rem', background: '#030712', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyber-cyan)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              API Responses:
            </div>
            {rawQuestionJson && (
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>POST /generate-question Output:</span>
                <pre style={{ margin: 0, fontSize: '0.75rem', color: '#a7f3d0', overflowX: 'auto' }}>
                  {rawQuestionJson}
                </pre>
              </div>
            )}
            {rawAnswerJson && (
              <div>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>POST /evaluate-cross-answer Output:</span>
                <pre style={{ margin: 0, fontSize: '0.75rem', color: '#fed7aa', overflowX: 'auto' }}>
                  {rawAnswerJson}
                </pre>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
