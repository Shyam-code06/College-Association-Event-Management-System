import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChange?.(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onChange, value]);

  return (
    <div className={cn('relative w-full max-w-xs', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full h-9 pl-9 pr-8 text-sm text-ink bg-surface border border-line rounded-sm transition-colors duration-150',
          'placeholder:text-muted/60',
          'focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none'
        )}
      />
      {internalValue && (
        <button
          type="button"
          onClick={() => {
            setInternalValue('');
            onChange?.('');
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-ink rounded-sm"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
