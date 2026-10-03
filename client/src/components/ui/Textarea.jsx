import React from 'react';
import { cn } from '@/utils/cn';

export const Textarea = React.forwardRef(({ className, rows = 3, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full p-3 text-sm text-ink bg-surface border rounded-sm transition-colors duration-150',
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

Textarea.displayName = 'Textarea';
