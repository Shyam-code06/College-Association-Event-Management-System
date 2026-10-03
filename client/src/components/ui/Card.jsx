import React from 'react';
import { cn } from '@/utils/cn';

export const Card = ({ className, children, hoverable = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-surface border border-line rounded-lg p-5 shadow-soft transition-all duration-150',
        hoverable && 'hover:shadow-card hover:border-primary/40 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
