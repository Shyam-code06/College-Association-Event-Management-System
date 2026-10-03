import { create } from 'zustand';

export const createWizardStore = (initialData = {}) => {
  return create((set) => ({
    currentStepIndex: 0,
    formData: { ...initialData },
    isSubmitting: false,
    error: null,

    setStep: (stepIndex) => set({ currentStepIndex: stepIndex, error: null }),

    nextStep: () =>
      set((state) => ({
        currentStepIndex: state.currentStepIndex + 1,
        error: null,
      })),

    prevStep: () =>
      set((state) => ({
        currentStepIndex: Math.max(0, state.currentStepIndex - 1),
        error: null,
      })),

    updateFormData: (data) =>
      set((state) => ({
        formData: { ...state.formData, ...data },
      })),

    setSubmitting: (isSubmitting) => set({ isSubmitting }),

    setError: (error) => set({ error }),

    reset: () =>
      set({
        currentStepIndex: 0,
        formData: { ...initialData },
        isSubmitting: false,
        error: null,
      }),
  }));
};
