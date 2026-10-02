import React from 'react';
import { History, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DebateTurn } from '../../types/debate';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface HistorySidebarProps {
  transcript: DebateTurn[];
  totalRounds: number;
  currentRound: number;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  transcript,
  totalRounds,
  currentRound,
}) => {
  // Group turns by round
  const roundsMap: Record<number, DebateTurn[]> = {};
  for (let i = 1; i <= totalRounds; i++) {
    roundsMap[i] = transcript.filter(t => t.roundNumber === i);
  }

  return (
    <Card className="arena-history-sidebar" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase' }}>
          <History size={16} style={{ color: 'var(--cyber-cyan)' }} />
          Round Log
        </div>
        <Badge variant="cyan">
          {currentRound} / {totalRounds} Live
        </Badge>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
        {Object.entries(roundsMap).map(([roundNumStr, turns]) => {
          const rNum = Number(roundNumStr);
          const isCurrent = rNum === currentRound;
          const isDone = turns.length >= 2;

          const affTurn = turns.find(t => t.side === 'affirmative');
          const negTurn = turns.find(t => t.side === 'negative');

          return (
            <div
              key={rNum}
              style={{
                background: isCurrent ? 'var(--bg-surface-2)' : 'var(--bg-surface-1)',
                border: isCurrent ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, fontSize: '0.85rem', color: isCurrent ? 'var(--cyber-cyan)' : 'var(--text-secondary)' }}>
                  ROUND {rNum} {isDone ? '• CONCLUDED' : isCurrent ? '• IN CLASH' : '• UPCOMING'}
                </span>
                {isDone ? (
                  <CheckCircle2 size={14} style={{ color: 'var(--matrix-green)' }} />
                ) : isCurrent ? (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--electric-gold)', boxShadow: '0 0 8px var(--electric-gold)' }} />
                ) : null}
              </div>

              {turns.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Awaiting speaker statements...
                </div>
              )}

              {affTurn && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--cyber-cyan)', fontWeight: 600 }}>
                    AFF: {affTurn.speakerName.split('_')[0]}
                  </span>
                  <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                    {affTurn.scores?.total ? `${affTurn.scores.total} pts` : 'Evaluating...'}
                  </span>
                </div>
              )}

              {negTurn && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--crimson-red)', fontWeight: 600 }}>
                    NEG: {negTurn.speakerName.split(' ')[0]}
                  </span>
                  <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                    {negTurn.scores?.total ? `${negTurn.scores.total} pts` : 'Evaluating...'}
                  </span>
                </div>
              )}

              {/* Fallacy check tag */}
              {turns.some(t => t.fallacies && t.fallacies.length > 0) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--crimson-red)' }}>
                  <AlertTriangle size={12} />
                  <span>Fallacy deductions registered</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
