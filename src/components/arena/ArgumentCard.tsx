import React, { useState } from 'react';
import { Cpu, HelpCircle, CheckCircle, ShieldAlert, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import { DebateTurn } from '../../types/debate';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { FallacyBadge } from './FallacyBadge';
import { SpeechMetricsCard } from '../voice/SpeechMetricsCard';

interface ArgumentCardProps {
  turn: DebateTurn;
}

export const ArgumentCard: React.FC<ArgumentCardProps> = ({ turn }) => {
  const [showSpeechDetails, setShowSpeechDetails] = useState(false);
  const isAffirmative = turn.side === 'affirmative';
  const hasVoiceMetrics = !!turn.speechMetrics;

  return (
    <Card
      variant={isAffirmative ? 'cyan' : 'crimson'}
      className="argument-turn-card"
    >
      <div className="turn-card-header">
        <div className="turn-author-info">
          <img
            src={turn.speakerAvatar}
            alt={turn.speakerName}
            className="turn-avatar-mini"
            style={{
              border: `1px solid ${isAffirmative ? 'var(--cyber-cyan)' : 'var(--crimson-red)'}`,
            }}
          />
          <div>
            <div className="turn-author-name">{turn.speakerName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Round {turn.roundNumber} • {turn.submittedAt}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {hasVoiceMetrics && (
            <button
              onClick={() => setShowSpeechDetails(!showSpeechDetails)}
              style={{
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid var(--cyber-cyan)',
                borderRadius: '4px',
                color: 'var(--cyber-cyan)',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-hud)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
              title="Click to view acoustic speech characteristics"
            >
              <Mic size={12} />
              <span>Voice ({turn.speechMetrics?.speakingSpeedWpm} WPM)</span>
              {showSpeechDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <Badge variant={isAffirmative ? 'cyan' : 'crimson'}>
            {isAffirmative ? 'Affirmative' : 'Negative'}
          </Badge>
          {turn.scores && (
            <div
              style={{
                fontFamily: 'var(--font-hud)',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: isAffirmative ? 'var(--cyber-cyan)' : 'var(--crimson-red)',
                background: 'var(--bg-surface-2)',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {turn.scores.total} pts
            </div>
          )}
        </div>
      </div>

      <p className="turn-body-text">{turn.argumentText}</p>

      {/* Voice Delivery Characteristics (Expandable) */}
      {showSpeechDetails && turn.speechMetrics && (
        <div style={{ margin: '0.65rem 0' }}>
          <SpeechMetricsCard metrics={turn.speechMetrics} compact={false} />
        </div>
      )}

      {/* Fallacy Warnings if any detected */}
      {turn.fallacies && turn.fallacies.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--crimson-red)', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-hud)' }}>
            Fallacy Alert:
          </span>
          {turn.fallacies.map(fallacy => (
            <FallacyBadge key={fallacy.id} fallacy={fallacy} />
          ))}
        </div>
      )}

      {/* AI Judge Adjudication Drawer */}
      {turn.scores && (
        <div className="turn-ai-evaluation-box">
          <div className="ai-eval-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={14} /> AI Judge Analysis
            </span>
            <span>Round {turn.roundNumber} Evaluation</span>
          </div>

          <div className="ai-score-pills">
            <span className="ai-score-pill-mini">Logic: <strong>{turn.scores.logic}/20</strong></span>
            <span className="ai-score-pill-mini">Relevance: <strong>{turn.scores.relevance}/15</strong></span>
            <span className="ai-score-pill-mini">Evidence: <strong>{turn.scores.evidence}/15</strong></span>
            <span className="ai-score-pill-mini">Rebuttal: <strong>{turn.scores.rebuttal}/20</strong></span>
            <span className="ai-score-pill-mini">Persuasion: <strong>{turn.scores.persuasiveness}/15</strong></span>
            {turn.scores.fallacyDeductions < 0 && (
              <span className="ai-score-pill-mini" style={{ color: 'var(--crimson-red)', borderColor: 'var(--crimson-red)' }}>
                Penalty: <strong>{turn.scores.fallacyDeductions} pts</strong>
              </span>
            )}
          </div>

          {turn.aiFeedbackSummary && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              {turn.aiFeedbackSummary}
            </p>
          )}

          {turn.aiCrossQuestion && (
            <div className="ai-cross-question-box">
              <HelpCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--electric-gold)' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--electric-gold)', textTransform: 'uppercase', fontSize: '0.75rem', fontFamily: 'var(--font-hud)', marginBottom: '2px' }}>
                  AI Cross-Examination Prompt
                </strong>
                {turn.aiCrossQuestion}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
