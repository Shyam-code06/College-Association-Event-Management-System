import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Building2, KeyRound } from 'lucide-react';

import { Wizard } from '@/components/ui/Wizard';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { StudentForgotPasswordModal } from '@/components/auth/StudentForgotPasswordModal';
import { createWizardStore } from '@/stores/wizard';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api/auth';


// Step 1: Account schema
const accountSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    college_id: z.string().min(1, 'Email must belong to an affiliated college campus'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Step 2: College schema (no manual college selection needed)
const collegeSchema = z.object({
  department: z.string().min(2, 'Department is required'),
  graduation_year: z.string().min(4, 'Graduation year is required'),
});

// Step 1 Component: Account & Auto-Campus Identification
const AccountStep = ({ formData, updateFormData, errors }) => {
  const email = formData.email ? formData.email.trim() : '';
  const emailDomain = email.includes('@') ? email.split('@')[1]?.toLowerCase().trim() : '';
  const matchedCollege = formData.college_name
    ? { name: formData.college_name, domain: formData.college_domain }
    : null;

  const handleEmailChange = async (val) => {
    const inputVal = val.trim();
    const domainPart = inputVal.includes('@') ? inputVal.split('@')[1]?.toLowerCase().trim() : '';

    if (domainPart && domainPart.includes('.')) {
      try {
        const res = await authApi.checkCampus(inputVal);
        const data = res.data || res;
        if (data.matched && data.college) {
          updateFormData({
            email: inputVal,
            college_id: String(data.college.id),
            college_name: data.college.name,
            college_domain: data.college.domain,
          });
          return;
        }
      } catch (err) {
        // Fallback
      }
    }

    updateFormData({
      email: inputVal,
      college_id: '',
      college_name: '',
      college_domain: '',
    });
  };


  return (
    <div className="space-y-4 text-left">
      <FormField label="Full Name" required error={errors.name}>
        <Input
          placeholder="e.g. Diya Sharma"
          value={formData.name || ''}
          onChange={(e) => updateFormData({ name: e.target.value })}
          autoFocus
        />
      </FormField>

      <FormField
        label="Institutional College Email"
        required
        error={errors.email || (!formData.college_id && emailDomain ? errors.college_id : undefined)}
        hint="Enter your official college email address (e.g. student@ldce.ac.in or student@skyline.edu)"
      >
        <Input
          type="email"
          placeholder="student@campus.edu"
          value={formData.email || ''}
          onChange={(e) => handleEmailChange(e.target.value)}
        />
      </FormField>

      {/* Real-time Campus Detection Feedback */}
      {emailDomain && (
        <div>
          {matchedCollege ? (
            <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-xs text-success flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">
                  Campus Identified: {matchedCollege.name}
                </span>
                <span className="text-[11px] opacity-90 block mt-0.5">
                  Verified institutional domain (@{matchedCollege.domain}). Tenancy assigned automatically.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-xs text-danger flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  Unrecognized Campus Domain (@{emailDomain})
                </span>
                <span className="text-[11px] opacity-90 block mt-0.5">
                  Only students with recognized institutional email addresses can create an account.
                  Please use your official college email.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted">Already have a student account?</span>
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-student-forgot-password', { detail: { email: formData.email } }));
          }}
          className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <KeyRound className="h-3 w-3" />
          Forgot Password?
        </button>
      </div>
    </div>
  );
};

// Step 2 Component: Academic Details (Campus already auto-identified)
const CollegeStep = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-5 text-left">
      {/* Auto-identified Campus Card */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
            Auto-Identified Campus
          </span>
          <h4 className="text-base font-bold text-ink leading-snug">
            {formData.college_name || 'Campus Institution'}
          </h4>
          <p className="text-xs text-muted flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
            <span>Verified through {formData.email}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Department / Major" required error={errors.department}>
          <Input
            placeholder="e.g. Computer Science & Engineering"
            value={formData.department || ''}
            onChange={(e) => updateFormData({ department: e.target.value })}
            autoFocus
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

// Step 3 Component: Review
const ReviewStep = ({ formData }) => {
  return (
    <div className="space-y-4 text-sm text-left">
      <div className="p-4 rounded-lg bg-canvas border border-line space-y-2.5">
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Full Name</span>
          <span className="font-semibold text-ink">{formData.name}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Institutional Email</span>
          <span className="font-semibold text-ink">{formData.email}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Assigned Campus</span>
          <span className="font-bold text-primary">{formData.college_name}</span>
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

// Step 4 Component: Done
const DoneStep = () => {
  return (
    <div className="text-center py-6">
      <div className="h-16 w-16 rounded-pill bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-bold text-ink mb-1">Registration Submitted!</h3>
      <p className="text-sm text-muted max-w-sm mx-auto">
        Your student association account has been created and submitted to your College Administrator for approval. Once approved, you can sign in to access your dashboard.
      </p>
    </div>
  );
};

export const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const registerStore = useMemo(
    () =>
      createWizardStore({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        college_id: '',
        college_name: '',
        college_domain: '',
        department: '',
        graduation_year: '2026',
      }),
    []
  );

  const steps = [
    {
      id: 'account',
      title: 'Create Your Account',
      subtitle: 'Enter your name and official campus email',
      schema: accountSchema,
      component: AccountStep,
    },
    {
      id: 'college',
      title: 'College Affiliation',
      subtitle: 'Specify your academic department & year',
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
      title: 'Registration Submitted',
      subtitle: '',
      component: DoneStep,
    },
  ];

  const handleSubmit = async (data) => {
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        college_id: data.college_id ? Number(data.college_id) : undefined,
      });

      const token = res.data?.token || res.token;
      const user = res.data?.user || res.user;

      if (token && user) {
        setAuth(token, user);
        toast.success(`Welcome, ${user.name}! Your account is active.`);
      } else {
        toast.success('Registration submitted! Awaiting College Admin approval.');
      }
    } catch (err) {
      toast.error(err?.message || 'Registration failed.');
      throw err;
    }
  };

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  React.useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail?.email) {
        setForgotEmail(e.detail.email);
      }
      setIsForgotModalOpen(true);
    };
    window.addEventListener('open-student-forgot-password', handleOpen);
    return () => window.removeEventListener('open-student-forgot-password', handleOpen);
  }, []);

  return (
    <div className="py-12 max-w-xl mx-auto px-4">
      <Wizard
        steps={steps}
        store={registerStore}
        onSubmit={handleSubmit}
        onDone={() => navigate('/login', { replace: true })}
        confirmButtonText="Confirm Registration"
        doneButtonText="Proceed to Sign In"
      />

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs text-muted mt-5">
        <span>Already registered?</span>
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
        <span className="hidden sm:inline text-line">•</span>
        <button
          type="button"
          onClick={() => {
            const currentEmail = registerStore.getState().formData.email || '';
            setForgotEmail(currentEmail);
            setIsForgotModalOpen(true);
          }}
          className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Forgot Password? (Student OTP Reset)
        </button>
      </div>

      <StudentForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        defaultEmail={forgotEmail}
      />
    </div>
  );
};

export default Register;
