import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items matching your criteria at this moment.',
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-12 bg-surface rounded-lg border border-line shadow-soft my-4',
        className
      )}
    >
      <div className="h-14 w-14 rounded-pill bg-canvas text-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-primary/60" />
      </div>

      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="text-xs text-muted max-w-sm mt-1 mb-6">{description}</p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
