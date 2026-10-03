import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { Wizard } from '@/components/ui/Wizard';
import { createWizardStore } from '@/stores/wizard';

describe('Wizard Component', () => {
  const step1Schema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
  });

  const Step1 = ({ formData, updateFormData, errors }) => (
    <div>
      <input
        aria-label="username"
        value={formData.username || ''}
        onChange={(e) => updateFormData({ username: e.target.value })}
      />
      {errors.username && <span>{errors.username}</span>}
    </div>
  );

  const Step2 = ({ formData }) => (
    <div>
      <span>Review: {formData.username}</span>
    </div>
  );

  const Step3 = () => <div>Done Screen</div>;

  it('blocks Next when step schema validation fails', async () => {
    const store = createWizardStore({ username: '' });
    const steps = [
      { id: '1', title: 'Step 1', schema: step1Schema, component: Step1 },
      { id: '2', title: 'Step 2', component: Step2 },
      { id: '3', title: 'Step 3', component: Step3 },
    ];

    render(<Wizard steps={steps} store={store} />);

    // Click Continue without input
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
    expect(store.getState().currentStepIndex).toBe(0);
  });

  it('advances when valid, keeps data on Back, and triggers submit', async () => {
    const store = createWizardStore({ username: '' });
    const onSubmit = vi.fn().mockResolvedValue({});
    const steps = [
      { id: '1', title: 'Step 1', schema: step1Schema, component: Step1 },
      { id: '2', title: 'Step 2', component: Step2 },
      { id: '3', title: 'Step 3', component: Step3 },
    ];

    render(<Wizard steps={steps} store={store} onSubmit={onSubmit} />);

    // Type valid username
    fireEvent.change(screen.getByLabelText('username'), { target: { value: 'SkylineUser' } });

    // Click Continue
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Should be on Step 2
    expect(screen.getByText('Review: SkylineUser')).toBeInTheDocument();
    expect(store.getState().currentStepIndex).toBe(1);

    // Click Back
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(store.getState().currentStepIndex).toBe(0);
    expect(screen.getByLabelText('username')).toHaveValue('SkylineUser');

    // Click Continue again to Step 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // On Step 2 (last input step before Done), button says "Confirm & Submit"
    const submitBtn = screen.getByRole('button', { name: /confirm & submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ username: 'SkylineUser' });
    });
  });
});
