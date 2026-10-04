import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Award, CheckCircle2, CreditCard, Plus, ArrowRight, Sparkles, Building2, Check, ShieldCheck, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Wizard } from '@/components/ui/Wizard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
  const activePlanIds = useMemo(() => {
    return (formData.activeMemberships || []).map((m) => m.plan_id);
  }, [formData.activeMemberships]);

  useEffect(() => {
    membershipsApi
      .getPlans()
      .then((res) => {
        const list = res.data || [];
        setPlans(list);

        // Pre-select first unjoined plan if available
        const unjoined = list.find((p) => !activePlanIds.includes(p.id));
        if (unjoined && !formData.planId) {
          updateFormData({
            planId: String(unjoined.id),
            selectedPlan: unjoined,
          });
        }
      })
      .catch((err) => console.error('Failed to load plans', err));
  }, [activePlanIds, formData.planId, updateFormData]);

  const handleSelect = (plan) => {
    if (activePlanIds.includes(plan.id)) return;
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
          const isAlreadyJoined = activePlanIds.includes(plan.id);
          const isSelected = String(formData.planId) === String(plan.id);
          return (
            <div
              key={plan.id}
              onClick={() => handleSelect(plan)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isAlreadyJoined
                  ? 'border-success/30 bg-success/5 opacity-80 cursor-not-allowed'
                  : isSelected
                  ? 'border-primary bg-primary-soft/30 shadow-soft cursor-pointer'
                  : 'border-line hover:border-line/80 bg-surface cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-ink">{plan.name}</h4>
                    {plan.organization && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                        {plan.organization}
                      </span>
                    )}
                    {isAlreadyJoined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-success/20 text-success border border-success/30 inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> Already Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Valid for {plan.duration_months || 12} months
                    {plan.ticket_discount_note ? ` • ${plan.ticket_discount_note}` : ' • Discounted member rates'}
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
        {plan.organization && (
          <div className="flex justify-between py-1 border-b border-line">
            <span className="text-muted">Organization / Club</span>
            <span className="font-semibold text-primary">{plan.organization}</span>
          </div>
        )}
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
        Association passes are non-refundable and tied to your student account.
      </p>
    </div>
  );
};

// Step 3: Payment Step
const PaymentStep = ({ formData }) => {
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
      You are now an active member of this organization. Member discounts will be automatically applied to your events and store purchases.
    </p>
  </div>
);

export const Membership = () => {
  const navigate = useNavigate();
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isJoiningNew, setIsJoiningNew] = useState(false);

  const fetchMembership = async () => {
    try {
      const res = await membershipsApi.getMyMembership();
      setMembershipData(res.data);
    } catch {
      setMembershipData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, []);

  const activeMemberships = useMemo(() => {
    return membershipData?.activeMemberships || [];
  }, [membershipData]);

  const pendingMemberships = useMemo(() => {
    return membershipData?.pendingMemberships || [];
  }, [membershipData]);

  const maxDiscountPercent = useMemo(() => {
    return Number(membershipData?.maxDiscountPercent || 0);
  }, [membershipData]);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const handleSubmitCancellation = async (e) => {
    e.preventDefault();
    if (!cancelTarget) return;
    setIsSubmittingCancel(true);
    try {
      await membershipsApi.requestCancellation(cancelTarget.id, cancelReason);
      toast.success('Cancellation request submitted successfully. Awaiting organization/admin review.');
      setCancelTarget(null);
      setCancelReason('');
      await fetchMembership();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit cancellation request.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleCompletePendingPayment = async (membershipId) => {
    setIsProcessingPayment(true);
    try {
      const pendingRes = await paymentsApi.getPending();
      const found = (pendingRes.data || []).find(
        (p) => p.payable_type === 'membership' && p.payable_id === membershipId
      );

      if (found) {
        await paymentsApi.process(found.id, true);
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
        activeMemberships: activeMemberships,
      }),
    [activeMemberships]
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

      const paymentId = res.data?.paymentId || res.data?.payment?.id;
      if (paymentId) {
        await paymentsApi.process(paymentId, true);
      }
      toast.success('Membership joined and activated successfully!');
      setIsJoiningNew(false);
      await fetchMembership();
    } catch (err) {
      toast.error(err?.message || 'Failed to activate membership.');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted text-sm">
        Loading membership information...
      </div>
    );
  }

  // Active student memberships dashboard
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Club & Association Memberships
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Join and manage multiple society memberships to unlock discounted tickets and merchandise.
          </p>
        </div>

        {activeMemberships.length > 0 && !isJoiningNew && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsJoiningNew(true)}
          >
            + Join Another Club
          </Button>
        )}
      </div>

      {/* KPI Perks Banner for Active Members */}
      {activeMemberships.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-surface border border-line rounded-xl shadow-soft flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] text-muted uppercase font-bold block">Active Clubs</span>
              <span className="text-lg font-extrabold text-ink">
                {activeMemberships.length} Active {activeMemberships.length === 1 ? 'Club' : 'Clubs'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-surface border border-line rounded-xl shadow-soft flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] text-muted uppercase font-bold block">Store Discount</span>
              <span className="text-lg font-extrabold text-secondary">
                {maxDiscountPercent}% Maximum OFF
              </span>
            </div>
          </div>

          <div className="p-4 bg-surface border border-line rounded-xl shadow-soft flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] text-muted uppercase font-bold block">Event Pricing</span>
              <span className="text-lg font-extrabold text-success">
                Member Rates Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pending Membership Dues Section */}
      {pendingMemberships.length > 0 && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-sm text-ink">Pending Membership Payments</h3>
          </div>
          <div className="space-y-2">
            {pendingMemberships.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center justify-between p-3 bg-surface rounded-lg border border-amber-500/20 text-xs"
              >
                <div>
                  <span className="font-bold text-ink">{pm.plan_name}</span>
                  {pm.organization && (
                    <span className="text-muted ml-2">({pm.organization})</span>
                  )}
                  <span className="block text-muted text-[11px] mt-0.5">
                    Amount Due: {formatCurrency(pm.plan_fee || 0)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isProcessingPayment}
                  onClick={() => handleCompletePendingPayment(pm.id)}
                >
                  Complete Payment
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Memberships Grid */}
      {activeMemberships.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
            Your Active Memberships ({activeMemberships.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMemberships.map((mem) => (
              <div
                key={mem.id}
                className="p-5 bg-surface border border-line rounded-xl shadow-soft flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-bold">
                      ✓ Active Pass
                    </span>
                    {mem.organization && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        {mem.organization}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-ink">{mem.plan_name}</h3>
                  <p className="text-xs text-muted mt-1">
                    Pass ID: #{mem.id} • Valid until {formatDate(mem.expiry_date)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-line text-xs">
                  <div>
                    <span className="text-muted text-[11px] block">Merch Discount:</span>
                    <span className="font-bold text-secondary">
                      {mem.merch_discount_percent || 10}% OFF
                    </span>
                  </div>
                  <div>
                    <span className="text-muted text-[11px] block">Event Pricing:</span>
                    <span className="font-bold text-primary">Member Rate</span>
                  </div>
                </div>

                {/* 5-Day Cancellation Workflow */}
                {(() => {
                  const joinedDate = new Date(mem.created_at || mem.start_date || Date.now());
                  const diffDays = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
                  const isEligible = diffDays <= 5;
                  const daysRemaining = Math.max(0, 5 - diffDays);

                  if (mem.cancellation_status === 'pending') {
                    return (
                      <div className="mt-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-amber-700">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Cancellation Pending Approval</span>
                        </div>
                        {mem.cancellation_reason && (
                          <p className="text-[11px] text-muted mt-1 italic line-clamp-2">
                            &ldquo;{mem.cancellation_reason}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  }

                  if (mem.cancellation_status === 'rejected') {
                    return (
                      <div className="mt-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-rose-700">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Cancellation Request Rejected</span>
                        </div>
                        {mem.cancellation_review_note && (
                          <p className="text-[11px] text-muted mt-0.5">
                            Note: {mem.cancellation_review_note}
                          </p>
                        )}
                      </div>
                    );
                  }

                  if (isEligible) {
                    return (
                      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
                        <span className="text-[11px] text-muted">
                          5-day cancel policy: <strong className="text-ink">{daysRemaining}d left</strong>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-danger hover:bg-danger/10 hover:text-danger h-7 px-2 font-medium"
                          onClick={() => {
                            setCancelTarget(mem);
                            setCancelReason('');
                          }}
                        >
                          Cancel Pass
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-4 pt-2 border-t border-line text-[11px] text-muted text-right">
                      5-day cancellation window closed
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
              Browse Discounted Events
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/student/store')}>
              Shop Merch with Member Discount
            </Button>
          </div>
        </div>
      )}

      {/* Join New Membership Wizard: Shown if no active memberships OR when user clicks "+ Join Another Club" */}
      {(activeMemberships.length === 0 || isJoiningNew) && (
        <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
            <div>
              <h2 className="text-lg font-bold text-ink">
                {activeMemberships.length > 0 ? 'Join Another Club Membership' : 'Join a Student Club Membership'}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Select from affiliated campus organizations to unlock discounts
              </p>
            </div>
            {activeMemberships.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIsJoiningNew(false)}>
                Cancel
              </Button>
            )}
          </div>

          <Wizard
            steps={steps}
            store={wizardStore}
            onSubmit={handleSubmit}
            onDone={() => {
              setIsJoiningNew(false);
              fetchMembership();
            }}
            confirmButtonText="Pay & Join Membership"
            doneButtonText="View My Memberships"
          />
        </div>
      )}

      {/* Cancellation Request Modal */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Request Membership Cancellation"
        maxWidth="max-w-md"
      >
        {cancelTarget && (
          <form onSubmit={handleSubmitCancellation} className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertCircle className="h-4 w-4" />
                5-Day Grace Period Policy
              </div>
              <p className="text-muted leading-relaxed">
                You joined <strong className="text-ink">{cancelTarget.plan_name}</strong> on{' '}
                {formatDate(cancelTarget.created_at || cancelTarget.start_date)}. Cancellation requests are
                reviewed and approved by the club organization or college admin.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explain why you want to cancel this club membership pass..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-md border border-line bg-canvas text-ink focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={isSubmittingCancel}
              >
                Keep Membership
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                className="bg-danger hover:bg-danger/90 text-white"
                isLoading={isSubmittingCancel}
              >
                Confirm Request
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Membership;
