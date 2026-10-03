import React from 'react';
import { cn } from '@/utils/cn';

export const StatCard = ({ title, value, subtitle, icon: Icon, variant = 'default', className }) => {
  const variantStyles = {
    default: 'text-ink bg-surface',
    primary: 'border-l-4 border-l-primary',
    success: 'border-l-4 border-l-success',
    danger: 'border-l-4 border-l-danger',
    info: 'border-l-4 border-l-info',
    warning: 'border-l-4 border-l-warning',
  };

  return (
    <div
      className={cn(
        'bg-surface border border-line rounded-lg p-5 shadow-soft flex items-center justify-between',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted select-none">
          {title}
        </span>
        <span className="text-2xl font-bold tracking-tight text-ink">{value}</span>
        {subtitle && <span className="text-xs text-muted mt-0.5">{subtitle}</span>}
      </div>

      {Icon && (
        <div className="h-12 w-12 rounded-md bg-canvas flex items-center justify-center text-primary shrink-0">
          <Icon className="h-6 w-6" />
        </div>
      )}
    </div>
  );
};
