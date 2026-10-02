import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 - 100
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'cyan' | 'crimson' | 'gold' | 'purple' | 'green';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'cyan',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const fillClass =
    color === 'crimson'
      ? 'hud-progress-fill-crimson'
      : color === 'gold'
      ? 'hud-progress-fill-gold'
      : color === 'purple'
      ? 'hud-progress-fill-purple'
      : 'hud-progress-fill-cyan';

  return (
    <div className={`score-progress-container ${className}`}>
      {(label || showValue) && (
        <div className="score-progress-label">
          {label && <span>{label}</span>}
          {showValue && (
            <span style={{ color: color === 'crimson' ? 'var(--crimson-red)' : 'var(--cyber-cyan)' }}>
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className="hud-progress-track">
        <div
          className={fillClass}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
