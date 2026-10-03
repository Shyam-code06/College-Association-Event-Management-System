import React from 'react';
import { cn } from '@/utils/cn';
import { getStatusStyle } from '@/config/statusColors';

export const Badge = ({ children, status, className }) => {
  const colorClasses = getStatusStyle(status);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold capitalize border tracking-wide select-none',
        colorClasses,
        className
      )}
    >
      {children || status}
    </span>
  );
};
