import React from 'react';
import { motion } from 'motion/react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'cyan' | 'crimson';
  hasNotches?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hasNotches = true,
  className = '',
  onClick,
}) => {
  const variantClass =
    variant === 'cyan'
      ? 'card-hud-cyan'
      : variant === 'crimson'
      ? 'card-hud-crimson'
      : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card-hud ${variantClass} ${className}`}
      onClick={onClick}
    >
      {hasNotches && (
        <>
          <div className="hud-notch-tl" />
          <div className="hud-notch-br" />
        </>
      )}
      {children}
    </motion.div>
  );
};
