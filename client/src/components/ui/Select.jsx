import React from 'react';
import { cn } from '@/utils/cn';

export const Select = React.forwardRef(({ className, options, children, error, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full h-10 px-3 text-sm text-ink bg-surface border rounded-sm transition-colors duration-150',
        'focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none',
        'disabled:bg-canvas disabled:text-muted disabled:cursor-not-allowed',
        error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-line',
        className
      )}
      {...props}
    >
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
});

Select.displayName = 'Select';
