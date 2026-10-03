import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { Button } from './Button';
import { Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  actions,
  searchComponent,
  filterComponent,
  className,
}) => {
  return (
    <div className={cn('bg-surface border-b border-line px-6 py-4 flex flex-col gap-3', className)}>
      {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {searchComponent}
          {filterComponent}

          {onAction && actionLabel && (
            <Button variant="primary" size="md" onClick={onAction} icon={ActionIcon}>
              {actionLabel}
            </Button>
          )}

          {actions}
        </div>
      </div>
    </div>
  );
};

export const ControlPanel = PageHeader;
