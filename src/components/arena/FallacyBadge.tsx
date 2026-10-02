import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { LogicalFallacy } from '../../types/debate';

interface FallacyBadgeProps {
  fallacy: LogicalFallacy;
}

export const FallacyBadge: React.FC<FallacyBadgeProps> = ({ fallacy }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.6rem',
          borderRadius: '4px',
          background: 'rgba(255, 51, 102, 0.15)',
          border: '1px solid var(--crimson-red)',
          color: 'var(--crimson-red)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-hud)',
          fontWeight: 700,
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        <AlertTriangle size={13} />
        {fallacy.name} ({fallacy.deduction > 0 ? `-${fallacy.deduction}` : `${fallacy.deduction}`} pts)
      </span>

      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '6px',
            width: '260px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--crimson-red)',
            borderRadius: '6px',
            padding: '0.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
            zIndex: 100,
            fontSize: '0.8rem',
            lineHeight: 1.4,
            color: '#fff',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--crimson-red)', marginBottom: '4px' }}>
            {fallacy.name} Detected
          </div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
            "{fallacy.quote}"
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {fallacy.explanation}
          </div>
        </div>
      )}
    </div>
  );
};
