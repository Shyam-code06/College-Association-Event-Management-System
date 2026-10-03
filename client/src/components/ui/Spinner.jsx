import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  };

  return <Loader2 className={cn('animate-spin text-primary', sizes[size] || sizes.md, className)} />;
};

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-sm bg-canvas-2', className)}
      {...props}
    />
  );
};
