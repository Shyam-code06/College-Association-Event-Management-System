import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export const Stepper = ({ steps = [], currentStepIndex = 0 }) => {
  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between relative">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <React.Fragment key={step.id || idx}>
              {/* Connector line */}
              {idx > 0 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 transition-colors duration-200 -mt-6',
                    idx <= currentStepIndex ? 'bg-primary' : 'bg-line'
                  )}
                />
              )}

              {/* Step indicator circle + label */}
              <div className="flex flex-col items-center z-10">
                <div
                  className={cn(
                    'h-12 w-12 rounded-pill flex items-center justify-center font-bold text-sm transition-all duration-200 select-none shadow-xs',
                    isCompleted && 'bg-primary text-surface',
                    isCurrent && 'bg-primary text-surface ring-4 ring-primary-soft',
                    !isCompleted && !isCurrent && 'bg-surface border-2 border-line text-muted'
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5 stroke-[2.5]" /> : idx + 1}
                </div>

                <span
                  className={cn(
                    'text-xs font-medium mt-2 text-center max-w-[80px] leading-tight select-none',
                    isCurrent ? 'text-primary font-bold' : isCompleted ? 'text-ink' : 'text-muted'
                  )}
                >
                  {step.title}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
