import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { Wizard } from '@/components/ui/Wizard';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createWizardStore } from '@/stores/wizard';
import { superAdminApi } from '@/api/superAdmin';
import { collegesApi } from '@/api/colleges';

// Step 1: College Selection
const collegeSchema = z.object({
  college_id: z.string().min(1, 'Please select a college institution'),
});

const CollegeStep = ({ formData, updateFormData, errors }) => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collegesApi
      .getPublic()
      .then((res) => {
        const list = res.data || [];
        setColleges(list);
        if (list.length > 0 && !formData.college_id) {
          updateFormData({
            college_id: String(list[0].id),
            college_name: list[0].name,
          });
        }
      })
      .catch((err) => console.error('Failed to load colleges', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <FormField label="Assigned College Campus" required error={errors.college_id}>
        <Select
          value={formData.college_id || ''}
          onChange={(e) => {
            const found = colleges.find((c) => String(c.id) === e.target.value);
            updateFormData({
              college_id: e.target.value,
              college_name: found?.name || '',
            });
          }}
          disabled={loading}
        >
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </Select>
      </FormField>

      <div className="p-3 bg-canvas border border-line rounded-md text-xs text-muted">
        The administrator created will have isolated administrative tenancy for this campus.
      </div>
    </div>
  );
};

// Step 2: Admin Account
const accountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid institutional email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const AccountStep = ({ formData, updateFormData, errors }) => (
  <div className="space-y-4">
    <FormField label="Administrator Full Name" required error={errors.name}>
      <Input
        placeholder="e.g. Dr. Ramesh Kumar"
        value={formData.name || ''}
        onChange={(e) => updateFormData({ name: e.target.value })}
      />
    </FormField>

    <FormField label="Administrator Email" required error={errors.email}>
      <Input
        type="email"
        placeholder="admin.ramesh@skyline.edu"
        value={formData.email || ''}
        onChange={(e) => updateFormData({ email: e.target.value })}
      />
    </FormField>

    <FormField label="Initial Password" required error={errors.password}>
      <Input
        type="password"
        placeholder="••••••••"
        value={formData.password || ''}
        onChange={(e) => updateFormData({ password: e.target.value })}
      />
    </FormField>
  </div>
);

// Step 3: Review
const ReviewStep = ({ formData }) => (
  <div className="space-y-4 text-sm">
    <div className="p-4 rounded-md bg-canvas border border-line space-y-2">
      <div className="flex justify-between py-1 border-b border-line">
        <span className="text-muted">Target College</span>
        <span className="font-semibold text-ink">{formData.college_name}</span>
      </div>
      <div className="flex justify-between py-1 border-b border-line">
        <span className="text-muted">Admin Name</span>
        <span className="font-semibold text-ink">{formData.name}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="text-muted">Login Email</span>
        <span className="font-semibold text-ink">{formData.email}</span>
      </div>
    </div>
  </div>
);

// Step 4: Done
const DoneStep = () => (
  <div className="text-center py-6">
    <div className="h-16 w-16 rounded-pill bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
      <CheckCircle2 className="h-10 w-10" />
    </div>
    <h3 className="text-xl font-bold text-ink mb-1">College Administrator Created!</h3>
    <p className="text-sm text-muted max-w-sm mx-auto">
      The college admin account has been provisioned and can now manage their association portal.
    </p>
  </div>
);

export const CreateCollegeAdmin = () => {
  const navigate = useNavigate();

  const wizardStore = useMemo(
    () =>
      createWizardStore({
        college_id: '',
        college_name: '',
        name: '',
        email: '',
        password: '',
      }),
    []
  );

  const steps = [
    {
      id: 'college',
      title: 'Select College',
      subtitle: 'Specify the institution campus',
      schema: collegeSchema,
      component: CollegeStep,
    },
    {
      id: 'account',
      title: 'Administrator Account',
      subtitle: 'Credentials for the college administrator',
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
        college_id: Number(formData.college_id),
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      toast.success('College administrator created!');
    } catch (err) {
      toast.error(err?.message || 'Failed to create college admin.');
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
        confirmButtonText="Provision Admin Account"
        doneButtonText="Back to Admins List"
      />
    </div>
  );
};

export default CreateCollegeAdmin;
