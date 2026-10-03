import React from 'react';
import { Switch as HeadlessSwitch } from '@headlessui/react';
import { cn } from '@/utils/cn';

export const Switch = ({ checked, onChange, disabled, className, label }) => {
  return (
    <HeadlessSwitch.Group as="div" className={cn('flex items-center gap-3', className)}>
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft',
          checked ? 'bg-primary' : 'bg-line',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-pill bg-surface shadow-sm ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </HeadlessSwitch>
      {label && (
        <HeadlessSwitch.Label className="text-sm font-medium text-ink cursor-pointer select-none">
          {label}
        </HeadlessSwitch.Label>
      )}
    </HeadlessSwitch.Group>
  );
};
