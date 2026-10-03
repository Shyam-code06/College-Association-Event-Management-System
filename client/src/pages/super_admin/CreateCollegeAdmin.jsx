import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle2, ArrowLeft, ShieldCheck, Mail, Building2 } from 'lucide-react';
import { Wizard } from '@/components/ui/Wizard';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { createWizardStore } from '@/stores/wizard';
import { superAdminApi } from '@/api/superAdmin';

// Step 1: College Institution Schema
const collegeSchema = z.object({
  college_name: z.string().min(3, 'College name must be at least 3 characters'),
  college_domain: z
    .string()
    .min(3, 'Official email domain is required (e.g. ldce.ac.in)')
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid domain format (e.g. ldce.ac.in)'),
});

const CollegeStep = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-4 text-left">
      <FormField
        label="College / University Name"
        required
        error={errors.college_name}
        hint="Full official name of the institution campus"
      >
        <Input
          placeholder="e.g. L.D. College of Engineering"
          value={formData.college_name || ''}
          onChange={(e) => updateFormData({ college_name: e.target.value })}
          autoFocus
        />
      </FormField>

      <FormField
        label="Official Campus Email Domain"
        required
        error={errors.college_domain}
        hint="e.g. ldce.ac.in — Only students with this email domain can register for this college"
      >
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted font-mono font-bold text-sm pointer-events-none">
            @
          </span>
          <Input
            placeholder="ldce.ac.in"
            value={formData.college_domain || ''}
            onChange={(e) =>
              updateFormData({
                college_domain: e.target.value.toLowerCase().replace(/^@/, '').trim(),
              })
            }
            className="pl-8 font-mono"
          />
        </div>
      </FormField>

      <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted flex items-start gap-2.5">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p>
          <strong>Automated Multi-Tenant Setup:</strong> Campus code and finance ledgers are
          configured automatically. Only students whose email ends with{' '}
          <strong className="text-primary font-mono">
            @{formData.college_domain || 'ldce.ac.in'}
          </strong>{' '}
          will be allowed to register into this college.
        </p>
      </div>
    </div>
  );
};

// Step 2: Administrator Account Schema
const accountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid institutional email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const AccountStep = ({ formData, updateFormData, errors }) => (
  <div className="space-y-4 text-left">
    <FormField label="Administrator Full Name" required error={errors.name}>
      <Input
        placeholder="e.g. Dr. Ramesh Kumar"
        value={formData.name || ''}
        onChange={(e) => updateFormData({ name: e.target.value })}
      />
    </FormField>

    <FormField
      label="Administrator Institutional Email"
      required
      error={errors.email}
      hint={formData.college_domain ? `e.g. admin@${formData.college_domain}` : undefined}
    >
      <Input
        type="email"
        placeholder={formData.college_domain ? `admin@${formData.college_domain}` : 'admin@campus.edu'}
        value={formData.email || ''}
        onChange={(e) => updateFormData({ email: e.target.value })}
      />
    </FormField>

    <FormField label="Initial Login Password" required error={errors.password}>
      <Input
        type="password"
        placeholder="••••••••"
        value={formData.password || ''}
        onChange={(e) => updateFormData({ password: e.target.value })}
      />
    </FormField>
  </div>
);

// Step 3: Review Step
const ReviewStep = ({ formData }) => {
  return (
    <div className="space-y-4 text-sm text-left">
      <div className="p-4 rounded-lg bg-canvas border border-line space-y-2.5">
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Target College</span>
          <span className="font-bold text-ink">{formData.college_name}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Authorized Student Domain</span>
          <span className="font-mono font-bold text-primary">@{formData.college_domain}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Admin Full Name</span>
          <span className="font-semibold text-ink">{formData.name}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Admin Login Email</span>
          <span className="font-semibold text-ink">{formData.email}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted">Tenant Isolation</span>
          <span className="text-success font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Automatic Multi-Tenant Boundary
          </span>
        </div>
      </div>
    </div>
  );
};

// Step 4: Done Step
const DoneStep = () => (
  <div className="text-center py-6">
    <div className="h-16 w-16 rounded-pill bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
      <CheckCircle2 className="h-10 w-10" />
    </div>
    <h3 className="text-xl font-bold text-ink mb-1">College & Administrator Provisioned!</h3>
    <p className="text-sm text-muted max-w-sm mx-auto">
      The college tenant and administrator account are fully active. Only verified students with the official
      domain can now register into this campus.
    </p>
  </div>
);

export const CreateCollegeAdmin = () => {
  const navigate = useNavigate();

  const wizardStore = useMemo(
    () =>
      createWizardStore({
        college_name: '',
        college_domain: '',
        name: '',
        email: '',
        password: '',
      }),
    []
  );

  const steps = [
    {
      id: 'college',
      title: 'College Institution',
      subtitle: 'Specify campus name and official email domain',
      schema: collegeSchema,
      component: CollegeStep,
    },
    {
      id: 'account',
      title: 'Administrator Account',
      subtitle: 'Credentials for the initial campus administrator',
      schema: accountSchema,
      component: AccountStep,
    },
    {
      id: 'review',
      title: 'Review Provisioning',
      subtitle: 'Verify details before creating the account',
      component: ReviewStep,
    },
    {
      id: 'done',
      title: 'Provisioning Complete',
      subtitle: '',
      component: DoneStep,
    },
  ];

  const handleSubmit = async (formData) => {
    try {
      await superAdminApi.createCollegeAdmin({
        collegeName: formData.college_name?.trim(),
        collegeDomain: formData.college_domain?.trim().toLowerCase().replace(/^@/, ''),
        adminName: formData.name?.trim(),
        adminEmail: formData.email?.trim().toLowerCase(),
        adminPassword: formData.password,
      });
      toast.success('New College and Administrator provisioned successfully!');
    } catch (err) {
      toast.error(err?.message || 'Failed to create college.');
      throw err;
    }
  };

  return (
    <div className="py-10 max-w-4xl mx-auto px-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/super-admin/college-admins')}
        icon={ArrowLeft}
        className="mb-4"
      >
        Back to College Admins
      </Button>
      <Wizard
        steps={steps}
        store={wizardStore}
        onSubmit={handleSubmit}
        onDone={() => navigate('/super-admin/college-admins')}
        confirmButtonText="Provision College & Admin"
        doneButtonText="Back to Admins List"
      />
    </div>
  );
};

export default CreateCollegeAdmin;
