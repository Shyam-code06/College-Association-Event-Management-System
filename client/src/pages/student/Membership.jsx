import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Award, CheckCircle2, CreditCard } from 'lucide-react';
import { Wizard } from '@/components/ui/Wizard';
import { Button } from '@/components/ui/Button';
import { createWizardStore } from '@/stores/wizard';
import { membershipsApi } from '@/api/memberships';
import { paymentsApi } from '@/api/payments';
import { formatCurrency, formatDate } from '@/utils/format';

// Step 1: Choose Plan
const planSchema = z.object({
  planId: z.string().min(1, 'Please select a membership plan'),
});

const ChoosePlanStep = ({ formData, updateFormData, errors }) => {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    membershipsApi
      .getPlans()
      .then((res) => {
        const list = res.data || [];
        setPlans(list);
        if (list.length > 0 && !formData.planId) {
          updateFormData({
            planId: String(list[0].id),
            selectedPlan: list[0],
          });
        }
      })
      .catch((err) => console.error('Failed to load plans', err));
  }, []);

  const handleSelect = (plan) => {
    updateFormData({
      planId: String(plan.id),
      selectedPlan: plan,
    });
  };

  return (
    <div className="space-y-4">
      {errors.planId && (
        <p className="text-xs text-danger font-medium">{errors.planId}</p>
      )}

      <div className="grid grid-cols-1 gap-3">
        {plans.map((plan) => {
          const isSelected = String(formData.planId) === String(plan.id);
          return (
            <div
              key={plan.id}
              onClick={() => handleSelect(plan)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary-soft/30 shadow-soft'
                  : 'border-line hover:border-line/80 bg-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-ink">{plan.name}</h4>
                  <p className="text-xs text-muted mt-0.5">
                    Valid for {plan.duration_months || 12} months
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-primary">
                    {formatCurrency(plan.fee)}
                  </span>
                  {plan.merch_discount_percent > 0 && (
                    <span className="block text-[11px] font-semibold text-secondary">
                      {plan.merch_discount_percent}% Merch Discount
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Step 2: Review Step
const ReviewPlanStep = ({ formData }) => {
  const plan = formData.selectedPlan || {};
  return (
    <div className="space-y-4 text-sm">
      <div className="p-4 rounded-md bg-canvas border border-line space-y-2">
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Selected Tier</span>
          <span className="font-semibold text-ink">{plan.name}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Duration</span>
          <span className="font-semibold text-ink">
            {plan.duration_months || 12} Months
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Merchandise Discount</span>
          <span className="font-semibold text-secondary">
            {plan.merch_discount_percent || 0}% Off
          </span>
        </div>
        <div className="flex justify-between py-2 text-base">
          <span className="font-bold text-ink">Total Membership Fee</span>
          <span className="font-extrabold text-primary">
            {formatCurrency(plan.fee || 0)}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted text-center">
        Association passes are non-refundable and tied to your student ID.
      </p>
    </div>
  );
};

// Step 3: Payment Step
const PaymentStep = ({ formData, _updateFormData }) => {
  return (
    <div className="space-y-4 text-center py-2">
      <div className="h-12 w-12 rounded-pill bg-primary-soft text-primary flex items-center justify-center mx-auto mb-2">
        <CreditCard className="h-6 w-6" />
      </div>
      <h4 className="font-bold text-base text-ink">Payment Processing</h4>
      <p className="text-xs text-muted max-w-sm mx-auto">
        Complete simulated payment for {formatCurrency(formData.selectedPlan?.fee || 0)}.
      </p>
      <div className="p-3 bg-canvas border border-line rounded-md text-xs text-muted">
        Payment Gateway Simulator: Instant digital clearance enabled.
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
    <h3 className="text-xl font-bold text-ink mb-1">Membership Activated!</h3>
    <p className="text-sm text-muted max-w-sm mx-auto">
      You are now an official association member. Member discounts will be automatically applied to your events and store purchases.
    </p>
  </div>
);

export const Membership = () => {
  const navigate = useNavigate();
  const [currentMembership, setCurrentMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const fetchMembership = async () => {
    try {
      const res = await membershipsApi.getMyMembership();
      setCurrentMembership(res.data);
    } catch {
      setCurrentMembership(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, []);

  const handleCompletePendingPayment = async () => {
    setIsProcessingPayment(true);
    try {
      let paymentId = currentMembership?.pendingPaymentId;
      if (!paymentId) {
        const pendingRes = await paymentsApi.getPending();
        const found = (pendingRes.data || []).find(
          (p) => p.payable_type === 'membership' && p.payable_id === currentMembership?.id
        );
        paymentId = found ? found.id : null;
      }

      if (paymentId) {
        await paymentsApi.process(paymentId, true);
        toast.success('Membership payment completed successfully!');
        await fetchMembership();
      } else {
        toast.error('Pending payment record not found. Please contact administration.');
      }
    } catch (err) {
      toast.error(err?.message || 'Payment processing failed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const wizardStore = useMemo(
    () =>
      createWizardStore({
        planId: '',
        selectedPlan: null,
      }),
    []
  );

  const steps = [
    {
      id: 'choose_plan',
      title: 'Choose Association Plan',
      subtitle: 'Select the membership tier that fits your student activities',
      schema: planSchema,
      component: ChoosePlanStep,
    },
    {
      id: 'review',
      title: 'Review Plan Details',
      subtitle: 'Verify fees and association perks',
      component: ReviewPlanStep,
    },
    {
      id: 'payment',
      title: 'Payment Confirmation',
      subtitle: 'Authorize your association membership dues',
      component: PaymentStep,
    },
    {
      id: 'done',
      title: 'Welcome Member',
      subtitle: '',
      component: DoneStep,
    },
  ];

  const handleSubmit = async (formData) => {
    try {
      const res = await membershipsApi.join({
        planId: Number(formData.planId),
      });

      // If a payment is created or required, auto-process it
      const paymentId = res.data?.paymentId || res.data?.payment?.id;
      if (paymentId) {
        await paymentsApi.process(paymentId, true);
      }
      toast.success('Membership joined and activated successfully!');
      await fetchMembership();
    } catch (err) {
      toast.error(err?.message || 'Failed to activate membership.');
      throw err;
    }
  };

  const isMembershipActive = Boolean(
    currentMembership?.isActive ||
    String(currentMembership?.status).toUpperCase() === 'ACTIVE'
  );

  if (!loading && isMembershipActive) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-surface border border-line rounded-lg p-8 shadow-card text-center space-y-6">
          <div className="h-16 w-16 rounded-pill bg-primary-soft text-primary flex items-center justify-center mx-auto">
            <Award className="h-8 w-8" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-pill bg-success/10 text-success text-xs font-bold uppercase mb-2">
              Active Member
            </span>
            <h1 className="text-2xl font-bold text-ink">
              {currentMembership.plan_name || 'Student Association Member'}
            </h1>
            <p className="text-xs text-muted mt-1">
              Member ID: #{currentMembership.id} • Expires: {formatDate(currentMembership.expiry_date)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-left">
            <div className="p-3 bg-canvas rounded-md border border-line">
              <span className="text-[11px] text-muted block">Store Discount</span>
              <span className="text-base font-bold text-primary">
                {currentMembership.merch_discount_percent || 10}% OFF
              </span>
            </div>
            <div className="p-3 bg-canvas rounded-md border border-line">
              <span className="text-[11px] text-muted block">Event Pricing</span>
              <span className="text-base font-bold text-secondary">
                Member Rate
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/events')}>
              Browse Discounted Events
            </Button>
            <Button variant="primary" onClick={() => navigate('/student/store')}>
              Shop Merch
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && currentMembership && (currentMembership.status === 'PENDING' || currentMembership.dues_status === 'unpaid')) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-surface border border-line rounded-lg p-8 shadow-card text-center space-y-6">
          <div className="h-16 w-16 rounded-pill bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <CreditCard className="h-8 w-8" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-pill bg-amber-500/10 text-amber-600 text-xs font-bold uppercase mb-2">
              Payment Pending
            </span>
            <h1 className="text-2xl font-bold text-ink">
              {currentMembership.plan_name || 'Membership'} (Pending Confirmation)
            </h1>
            <p className="text-xs text-muted mt-1">
              You have already joined this membership plan. Please complete the pending dues payment to activate all your member benefits.
            </p>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <Button
              variant="primary"
              onClick={handleCompletePendingPayment}
              isLoading={isProcessingPayment}
            >
              Complete Payment Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <Wizard
        steps={steps}
        store={wizardStore}
        onSubmit={handleSubmit}
        onDone={() => navigate('/student/dashboard')}
        confirmButtonText="Pay & Join Association"
        doneButtonText="Go to Dashboard"
      />
    </div>
  );
};

export default Membership;
