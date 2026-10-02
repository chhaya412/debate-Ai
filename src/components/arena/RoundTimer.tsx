import React from 'react';
import { Timer } from 'lucide-react';

interface RoundTimerProps {
  secondsRemaining: number;
}

export const RoundTimer: React.FC<RoundTimerProps> = ({ secondsRemaining }) => {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const isLowTime = secondsRemaining <= 30;

  return (
    <div className={`countdown-timer-display ${isLowTime ? 'danger' : ''}`}>
      <Timer size={20} style={{ color: isLowTime ? 'var(--crimson-red)' : 'var(--cyber-cyan)' }} />
      <span>{formatted}</span>
    </div>
  );
};
