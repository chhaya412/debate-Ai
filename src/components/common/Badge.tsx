import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'crimson' | 'gold' | 'purple' | 'green' | 'default';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  icon,
  className = '',
}) => {
  const variantClass =
    variant === 'cyan'
      ? 'badge-cyan'
      : variant === 'crimson'
      ? 'badge-crimson'
      : variant === 'gold'
      ? 'badge-gold'
      : variant === 'purple'
      ? 'badge-purple'
      : variant === 'green'
      ? 'badge-green'
      : '';

  return (
    <span className={`badge-tactical ${variantClass} ${className}`}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};
