import React from 'react';
import { cn } from '@/utils/cn';

export const Input = React.forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'w-full h-10 px-3 text-sm text-ink bg-surface border rounded-sm transition-colors duration-150',
        'placeholder:text-muted/60',
        'focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none',
        'disabled:bg-canvas disabled:text-muted disabled:cursor-not-allowed',
        error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-line',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
