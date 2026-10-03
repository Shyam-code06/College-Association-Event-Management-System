import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';

describe('FormField Component', () => {
  it('renders label and required indicator', () => {
    render(
      <FormField label="Full Name" required>
        <Input placeholder="Enter name" />
      </FormField>
    );

    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveClass('text-danger');
  });

  it('displays error message when error prop is provided', () => {
    render(
      <FormField label="Email" error="Invalid email address">
        <Input placeholder="Enter email" />
      </FormField>
    );

    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    expect(screen.getByText('Invalid email address')).toHaveClass('text-danger');
  });

  it('renders hint text when provided without error', () => {
    render(
      <FormField label="Password" hint="Minimum 6 characters">
        <Input placeholder="Enter password" />
      </FormField>
    );

    expect(screen.getByText('Minimum 6 characters')).toBeInTheDocument();
  });
});
