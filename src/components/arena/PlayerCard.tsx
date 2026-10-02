import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { DebaterProfile, DebateSide } from '../../types/debate';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';

interface PlayerCardProps {
  player: DebaterProfile;
  side: DebateSide;
  isActiveTurn: boolean;
  score: number;
  maxScore?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  side,
  isActiveTurn,
  score,
  maxScore = 300,
}) => {
  const isAffirmative = side === 'affirmative';
  const themeColor = isAffirmative ? 'cyan' : 'crimson';

  return (
    <Card
      variant={isAffirmative ? 'cyan' : 'crimson'}
      className={`debater-versus-panel ${isActiveTurn ? 'active-turn-glow' : ''}`}
    >
      <div className="panel-player-header">
        <img
          src={player.avatar}
          alt={player.name}
          className="panel-avatar"
          style={{
            border: `2px solid ${isAffirmative ? 'var(--cyber-cyan)' : 'var(--crimson-red)'}`,
            boxShadow: isActiveTurn
              ? `0 0 20px ${isAffirmative ? 'var(--cyber-cyan-glow)' : 'var(--crimson-red-glow)'}`
              : 'none',
          }}
        />
        <div className="panel-player-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
            <Badge variant={isAffirmative ? 'cyan' : 'crimson'}>
              {isAffirmative ? 'Affirmative' : 'Negative'}
            </Badge>
            {isActiveTurn && (
              <Badge variant="gold" icon={<Sparkles size={11} />}>
                Speaking
              </Badge>
            )}
          </div>
          <h3>{player.name}</h3>
          <span>{player.title}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-2)', padding: '0.6rem 0.85rem', borderRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontFamily: 'var(--font-hud)', fontWeight: 600 }}>
          <Shield size={14} style={{ color: 'var(--electric-gold)' }} />
          <span>{player.rankTier}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, fontSize: '0.85rem' }}>
          ELO <span style={{ color: 'var(--electric-gold)' }}>{player.elo}</span>
        </div>
      </div>

      <div style={{ marginTop: '0.25rem' }}>
        <ProgressBar
          value={score}
          max={maxScore}
          label="Cumulative Score"
          color={themeColor}
          showValue={true}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span>Style: <strong style={{ color: 'var(--text-secondary)' }}>{player.debateStyle}</strong></span>
        <span>Win Rate: <strong style={{ color: 'var(--matrix-green)' }}>{player.winRate}%</strong></span>
      </div>
    </Card>
  );
};
