import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none rounded-sm',
  {
    variants: {
      variant: {
        ghost: 'text-muted hover:text-ink hover:bg-canvas active:bg-canvas-2',
        outline: 'border border-line bg-surface text-ink hover:bg-canvas',
        primary: 'bg-primary text-surface hover:bg-primary-hover active:bg-primary-dark',
        soft: 'bg-primary-soft text-primary hover:bg-primary/20',
      },
      size: {
        sm: 'h-7 w-7 p-1',
        md: 'h-9 w-9 p-2',
        lg: 'h-11 w-11 p-2.5',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  }
);

export const IconButton = React.forwardRef(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(iconButtonVariants({ variant, size }), className)} {...props}>
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
