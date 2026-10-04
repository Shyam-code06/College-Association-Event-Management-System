import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Plus,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Wizard } from '@/components/ui/Wizard';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FileUpload } from '@/components/ui/FileUpload';
import { Badge } from '@/components/ui/Badge';
import { createWizardStore } from '@/stores/wizard';
import { useAuthStore } from '@/stores/auth';
import { expensesApi } from '@/api/expenses';
import { eventsApi } from '@/api/events';
import { formatCurrency, formatDateTime } from '@/utils/format';

// Step 1: Details
const detailsSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  reason: z.string().min(3, 'Please describe the expense in at least 3 characters'),
  event_id: z.string().optional(),
});

const DetailsStep = ({ formData, updateFormData, errors }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    eventsApi.list({ limit: 50 }).then((res) => {
      setEvents(res.data || []);
    });
  }, []);

  return (
    <div className="space-y-4">
      <FormField label="Claim Amount (INR ₹)" required error={errors.amount}>
        <Input
          type="number"
          placeholder="e.g. 1500"
          value={formData.amount || ''}
          onChange={(e) => updateFormData({ amount: e.target.value })}
        />
      </FormField>

      <FormField label="Purpose / Reason" required error={errors.reason}>
        <Input
          placeholder="e.g. Workshop refreshments, stationery"
          value={formData.reason || ''}
          onChange={(e) => updateFormData({ reason: e.target.value })}
        />
      </FormField>

      <FormField label="Associated Event (Optional)">
        <Select
          value={formData.event_id || ''}
          onChange={(e) => updateFormData({ event_id: e.target.value })}
        >
          <option value="">-- General Association Expense --</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  );
};

// Step 2: Receipt Upload
const uploadSchema = z.object({
  receipt: z.any().refine((file) => file !== null && file !== undefined, {
    message: 'Receipt document or photo is required for reimbursement',
  }),
});

const ReceiptUploadStep = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-4">
      <FormField label="Upload Tax Invoice / Bill" required error={errors.receipt}>
        <FileUpload
          value={formData.receipt}
          onChange={(file) => updateFormData({ receipt: file })}
          error={Boolean(errors.receipt)}
        />
      </FormField>
      <p className="text-xs text-muted text-center">
        Ensure the bill date, vendor GST/name, and total amount are legible.
      </p>
    </div>
  );
};

// Step 3: Review
const ReviewExpenseStep = ({ formData }) => {
  return (
    <div className="space-y-4 text-sm">
      <div className="p-4 rounded-md bg-canvas border border-line space-y-2">
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Claimed Amount</span>
          <span className="font-bold text-primary text-base">
            {formatCurrency(formData.amount || 0)}
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Expense Purpose</span>
          <span className="font-semibold text-ink">{formData.reason}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted">Attached Receipt</span>
          <span className="font-medium text-ink truncate max-w-[200px]">
            {formData.receipt?.name || 'receipt-doc'}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted text-center">
        All claims are audited by college finance administrators before settlement.
      </p>
    </div>
  );
};

// Step 4: Done
const DoneExpenseStep = () => (
  <div className="text-center py-6">
    <div className="h-16 w-16 rounded-pill bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
      <CheckCircle2 className="h-10 w-10" />
    </div>
    <h3 className="text-xl font-bold text-ink mb-1">Expense Claim Submitted!</h3>
    <p className="text-sm text-muted max-w-sm mx-auto">
      Your reimbursement claim has been forwarded to the college admin queue for verification.
    </p>
  </div>
);

export const MyExpenses = () => {
  const { user } = useAuthStore();
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const wizardStore = useMemo(
    () =>
      createWizardStore({
        amount: '',
        reason: '',
        event_id: '',
        receipt: null,
      }),
    []
  );

  const steps = [
    {
      id: 'details',
      title: 'Expense Details',
      subtitle: 'Amount and explanation of incurred expense',
      schema: detailsSchema,
      component: DetailsStep,
    },
    {
      id: 'receipt',
      title: 'Receipt & Documentation',
      subtitle: 'Upload proof of payment',
      schema: uploadSchema,
      component: ReceiptUploadStep,
    },
    {
      id: 'review',
      title: 'Review Reimbursement Claim',
      subtitle: 'Check all claim details before submitting',
      component: ReviewExpenseStep,
    },
    {
      id: 'done',
      title: 'Claim Queued',
      subtitle: '',
      component: DoneExpenseStep,
    },
  ];

  const handleSubmit = async (formData) => {
    try {
      const data = new FormData();
      data.append('amount', formData.amount);
      data.append('reason', formData.reason);
      if (formData.event_id) {
        data.append('event_id', formData.event_id);
      }
      if (formData.receipt) {
        data.append('receipt', formData.receipt);
      }

      await expensesApi.submitExpense(data);
      toast.success('Reimbursement claim submitted!');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to submit expense claim.');
      throw err;
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Claim ID',
      render: (row) => <span className="font-mono font-semibold">{row.id}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className="font-bold text-ink">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: 'reason',
      header: 'Purpose / Reason',
      render: (row) => <span className="text-muted">{row.reason}</span>,
    },
    {
      key: 'status',
      header: 'Review Status',
      render: (row) => <Badge status={row.status || 'PENDING'} />,
    },
    {
      key: 'review_note',
      header: 'Reviewer Note',
      render: (row) => (
        <span className="text-xs text-muted">
          {row.review_note || 'Awaiting review'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Submitted',
      render: (row) => formatDateTime(row.created_at),
    },
  ];

  if (isSubmittingNew) {
    return (
      <div className="py-10 max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSubmittingNew(false)}
          icon={ArrowLeft}
          className="mb-4"
        >
          Back to Claims List
        </Button>
        <Wizard
          steps={steps}
          store={wizardStore}
          onSubmit={handleSubmit}
          onDone={() => {
            wizardStore.getState().reset();
            setIsSubmittingNew(false);
          }}
          confirmButtonText="Submit Claim"
          doneButtonText="Back to Claims List"
        />
      </div>
    );
  }

  return (
    <ResourceListPage
      key={refreshKey}
      title="Organizer Expense Reimbursements"
      subtitle="Submit bills and track reimbursement approval for association event expenses"
      breadcrumbs={[
        {
          label: 'Organizer Hub',
          href: '/organizer/events'
        },
        { label: 'Expenses', href: '/organizer/expenses' },
      ]}
      api={expensesApi.getMyExpenses}
      columns={columns}
      actionLabel="New Expense Claim"
      onAction={() => {
        wizardStore.getState().reset();
        setIsSubmittingNew(true);
      }}
      actionIcon={Plus}
      searchPlaceholder="Search expense claims..."
      emptyTitle="No reimbursement claims found"
      emptyDescription="Submit a claim with your receipt to receive approval."
    />
  );
};

export default MyExpenses;
