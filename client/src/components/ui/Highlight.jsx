import React from 'react';
import { cn } from '@/utils/cn';

const HIGHLIGHT_STYLES = {
  yellow: 'bg-accent/30 text-ink decoration-accent',
  blue: 'bg-secondary/20 text-ink decoration-secondary',
  red: 'bg-danger/20 text-ink decoration-danger',
  green: 'bg-success/20 text-ink decoration-success',
  purple: 'bg-primary-soft text-primary decoration-primary',
};

export const Highlight = ({ children, color = 'yellow', className }) => {
  const colorClass = HIGHLIGHT_STYLES[color] || HIGHLIGHT_STYLES.yellow;

  return (
    <span
      className={cn(
        'relative inline-block px-1.5 py-0.5 rounded-sm font-semibold transition-all duration-150',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  );
};
