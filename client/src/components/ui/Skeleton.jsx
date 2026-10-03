import React from 'react';
import { cn } from '@/utils/cn';

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-sm bg-canvas-2', className)}
      {...props}
    />
  );
};
