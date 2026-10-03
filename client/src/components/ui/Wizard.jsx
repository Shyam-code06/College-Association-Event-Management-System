import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Stepper } from './Stepper';
import { Button } from './Button';
import { Card } from './Card';
import { cn } from '@/utils/cn';

export const Wizard = ({
  steps = [],
  store,
  onSubmit,
  onDone,
  confirmButtonText = 'Confirm & Submit',
  doneButtonText = 'Done',
  className,
}) => {
  const currentStepIndex = store((state) => state.currentStepIndex);
  const formData = store((state) => state.formData);
  const isSubmitting = store((state) => state.isSubmitting);
  const error = store((state) => state.error);
  const nextStep = store((state) => state.nextStep);
  const prevStep = store((state) => state.prevStep);
  const updateFormData = store((state) => state.updateFormData);
  const setSubmitting = store((state) => state.setSubmitting);
  const setError = store((state) => state.setError);

  const [stepErrors, setStepErrors] = useState({});

  // Reset store on unmount
  useEffect(() => {
    return () => {
      // optional cleanup if wizard is abandoned
    };
  }, []);

  const currentStep = steps[currentStepIndex] || {};
  const isLastInputStep = currentStepIndex === steps.length - 2;
  const isFinalStep = currentStepIndex === steps.length - 1;
  const hasOnlyOneStep = steps.length <= 1;

  const validateCurrentStep = () => {
    if (!currentStep.schema) {
      setStepErrors({});
      return true;
    }

    const result = currentStep.schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        fieldErrors[path] = err.message;
      });
      setStepErrors(fieldErrors);
      return false;
    }

    setStepErrors({});
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    if (isLastInputStep || (hasOnlyOneStep && !isFinalStep)) {
      if (onSubmit) {
        try {
          setSubmitting(true);
          setError(null);
          await onSubmit(formData);
          nextStep();
        } catch (err) {
          setError(err?.message || 'Failed to submit form.');
        } finally {
          setSubmitting(false);
        }
      } else {
        nextStep();
      }
    } else if (isFinalStep) {
      if (onDone) onDone();
    } else {
      nextStep();
    }
  };

  const StepComponent = currentStep.component;

  return (
    <div className={cn('w-full max-w-3xl mx-auto py-6 px-4', className)}>
      {/* Stepper only if more than 1 step */}
      {steps.length > 1 && (
        <Stepper steps={steps} currentStepIndex={currentStepIndex} />
      )}

      {/* Main Form Card */}
      <Card
        variant="elevated"
        className="w-full max-w-xl mx-auto p-6 md:p-8 rounded-lg border border-line bg-surface shadow-card transition-all duration-200 mt-2"
      >
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-ink">
            {currentStep.title}
          </h2>
          {currentStep.subtitle && (
            <p className="text-sm text-muted mt-1.5">{currentStep.subtitle}</p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-md bg-danger/10 border border-danger/30 text-danger text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* Step Component */}
        <div className="min-h-[220px] mb-8">
          {StepComponent && (
            <StepComponent
              formData={formData}
              updateFormData={updateFormData}
              errors={stepErrors}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-line">
          {!isFinalStep && currentStepIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-1/2 justify-center"
              onClick={prevStep}
              disabled={isSubmitting}
              icon={ArrowLeft}
            >
              Back
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            className={cn(
              'justify-center font-semibold',
              isFinalStep || currentStepIndex === 0 ? 'w-full' : 'w-1/2'
            )}
            onClick={handleNext}
            isLoading={isSubmitting}
          >
            {isFinalStep
              ? doneButtonText
              : isLastInputStep
              ? confirmButtonText
              : 'Continue'}
            {!isFinalStep && !isLastInputStep && (
              <ArrowRight className="h-4 w-4 ml-2" />
            )}
            {isFinalStep && <CheckCircle2 className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};
