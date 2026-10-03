import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import { Wizard } from '@/components/ui/Wizard';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createWizardStore } from '@/stores/wizard';
import { authApi } from '@/api/auth';
import { collegesApi } from '@/api/colleges';

// Step 1: Account schema
const accountSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Step 2: College schema
const collegeSchema = z.object({
  college_id: z.string().min(1, 'Please select your college'),
  department: z.string().min(2, 'Department is required'),
  graduation_year: z.string().min(4, 'Graduation year is required'),
});

// Step 1 Component
const AccountStep = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-4">
      <FormField label="Full Name" required error={errors.name}>
        <Input
          placeholder="e.g. Diya Sharma"
          value={formData.name || ''}
          onChange={(e) => updateFormData({ name: e.target.value })}
        />
      </FormField>

      <FormField label="College Email" required error={errors.email}>
        <Input
          type="email"
          placeholder="diya@skyline.edu"
          value={formData.email || ''}
          onChange={(e) => updateFormData({ email: e.target.value })}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Password" required error={errors.password}>
          <Input
            type="password"
            placeholder="••••••••"
            value={formData.password || ''}
            onChange={(e) => updateFormData({ password: e.target.value })}
          />
        </FormField>

        <FormField label="Confirm Password" required error={errors.confirmPassword}>
          <Input
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword || ''}
            onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
          />
        </FormField>
      </div>
    </div>
  );
};

// Step 2 Component
const CollegeStep = ({ formData, updateFormData, errors }) => {
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);

  useEffect(() => {
    collegesApi
      .getPublic()
      .then((res) => {
        const list = res.data || [];
        setColleges(list);
        if (list.length > 0 && !formData.college_id) {
          updateFormData({ college_id: String(list[0].id) });
        }
      })
      .catch((err) => console.error('Failed to load colleges', err))
      .finally(() => setLoadingColleges(false));
  }, []);

  return (
    <div className="space-y-4">
      <FormField label="Select College / Campus" required error={errors.college_id}>
        <Select
          value={formData.college_id || ''}
          onChange={(e) => updateFormData({ college_id: e.target.value })}
          disabled={loadingColleges}
        >
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Department / Major" required error={errors.department}>
          <Input
            placeholder="e.g. Computer Science"
            value={formData.department || ''}
            onChange={(e) => updateFormData({ department: e.target.value })}
          />
        </FormField>

        <FormField label="Graduation Year" required error={errors.graduation_year}>
          <Input
            placeholder="e.g. 2026"
            value={formData.graduation_year || ''}
            onChange={(e) => updateFormData({ graduation_year: e.target.value })}
          />
        </FormField>
      </div>
    </div>
  );
};

// Step 3 Component
const ReviewStep = ({ formData }) => {
  return (
    <div className="space-y-4 text-sm">
      <div className="p-4 rounded-md bg-canvas border border-line space-y-2">
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Full Name</span>
          <span className="font-semibold text-ink">{formData.name}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Email</span>
          <span className="font-semibold text-ink">{formData.email}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Department</span>
          <span className="font-semibold text-ink">{formData.department}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted">Graduation Year</span>
          <span className="font-semibold text-ink">{formData.graduation_year}</span>
        </div>
      </div>

      <p className="text-xs text-muted text-center">
        By registering, you agree to your student association terms and campus policies.
      </p>
    </div>
  );
};

// Step 4 Component
const DoneStep = () => {
  return (
    <div className="text-center py-6">
      <div className="h-16 w-16 rounded-pill bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-bold text-ink mb-1">Registration Complete!</h3>
      <p className="text-sm text-muted max-w-sm mx-auto">
        Your student association account has been created. You can now sign in and explore campus events.
      </p>
    </div>
  );
};

export const Register = () => {
  const navigate = useNavigate();
  const registerStore = useMemo(
    () =>
      createWizardStore({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        college_id: '',
        department: '',
        graduation_year: '2026',
      }),
    []
  );

  const steps = [
    {
      id: 'account',
      title: 'Create Your Account',
      subtitle: 'Enter your basic student details',
      schema: accountSchema,
      component: AccountStep,
    },
    {
      id: 'college',
      title: 'College Affiliation',
      subtitle: 'Specify your campus and academic department',
      schema: collegeSchema,
      component: CollegeStep,
    },
    {
      id: 'review',
      title: 'Review Registration',
      subtitle: 'Please verify your information before confirming',
      component: ReviewStep,
    },
    {
      id: 'done',
      title: 'Welcome to Skyline',
      subtitle: '',
      component: DoneStep,
    },
  ];

  const handleSubmit = async (data) => {
    try {
      await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        college_id: Number(data.college_id),
      });
      toast.success('Account created successfully!');
    } catch (err) {
      toast.error(err?.message || 'Registration failed.');
      throw err;
    }
  };

  return (
    <div className="py-12">
      <Wizard
        steps={steps}
        store={registerStore}
        onSubmit={handleSubmit}
        onDone={() => navigate('/login')}
        confirmButtonText="Confirm Registration"
        doneButtonText="Proceed to Login"
      />
      <p className="text-center text-xs text-muted mt-4">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default Register;
