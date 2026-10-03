import React from 'react';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-surface hover:bg-primary-hover active:bg-primary-dark shadow-sm',
        secondary: 'bg-secondary text-surface hover:opacity-90 active:opacity-100 shadow-sm',
        outline: 'border border-line bg-surface text-ink hover:bg-canvas active:bg-canvas-2',
        ghost: 'text-ink hover:bg-canvas active:bg-canvas-2',
        danger: 'bg-danger text-surface hover:opacity-90 active:opacity-100 shadow-sm',
        soft: 'bg-primary-soft text-primary hover:bg-primary/20',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-sm gap-1.5',
        md: 'h-10 px-4 text-sm rounded-sm gap-2',
        lg: 'h-12 px-6 text-base rounded-md gap-2.5',
        pill: 'h-11 px-7 text-sm rounded-pill gap-2',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export const Button = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      isLoading,
      disabled,
      children,
      icon: Icon,
      ...props
    },
    ref
  ) => {
    const isButtonLoading = Boolean(loading || isLoading);

    return (
      <button
        ref={ref}
        disabled={disabled || isButtonLoading}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {isButtonLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : Icon ? (
          <Icon className="h-4 w-4 shrink-0" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
