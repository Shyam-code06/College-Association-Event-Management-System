import React from 'react';
import { cn } from '@/utils/cn';

export const FormField = ({ label, error, hint, required, className, children, id }) => {
  return (
    <div className={cn('flex flex-col gap-1.5 text-left w-full', className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-ink select-none">
          {label}
          {required && <span className="text-danger ml-1 font-bold">*</span>}
        </label>
      )}

      {children}

      {hint && !error && <p className="text-xs text-muted mt-0.5">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-danger font-medium mt-0.5 animate-fadeIn">
          {typeof error === 'string' ? error : error?.message}
        </p>
      )}
    </div>
  );
};
