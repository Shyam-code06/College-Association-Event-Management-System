import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Award,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  X,
  ShieldAlert,
  Building2,
  Users,
  Search,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { membershipsApi } from '@/api/memberships';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency, formatDate } from '@/utils/format';

export const Plans = () => {
  const { user } = useAuthStore();
  const isCollegeAdmin = user?.role === 'college_admin';

  const [plans, setPlans] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('Odoo Student Association');
  const [fee, setFee] = useState('');
  const [durationMonths, setDurationMonths] = useState('12');
  const [merchDiscountPercent, setMerchDiscountPercent] = useState('10');
  const [ticketDiscountNote, setTicketDiscountNote] = useState('');
  const [assignedOrganizers, setAssignedOrganizers] = useState([]);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Enrolled Students modal & cancellation review state
  const [viewingPlan, setViewingPlan] = useState(null);
  const [planMembers, setPlanMembers] = useState([]);
  const [isLoadingPlanMembers, setIsLoadingPlanMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [cancellationTarget, setCancellationTarget] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleOpenMembers = async (plan) => {
    setViewingPlan(plan);
    setMemberSearchQuery('');
    setIsLoadingPlanMembers(true);
    try {
      const res = await membershipsApi.getPlanMembers(plan.id);
      setPlanMembers(res.data?.members || []);
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch enrolled students.');
    } finally {
      setIsLoadingPlanMembers(false);
    }
  };

  const handleReviewCancellation = async (action) => {
    if (!cancellationTarget) return;
    setIsSubmittingReview(true);
    try {
      await membershipsApi.reviewCancellation(cancellationTarget.id, action, reviewNote);
      toast.success(
        `Cancellation request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`
      );
      setCancellationTarget(null);
      setReviewNote('');
      if (viewingPlan) {
        handleOpenMembers(viewingPlan);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to review cancellation request.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await membershipsApi.getPlans();
      setPlans(res.data || []);
    } catch (err) {
      console.error('Failed to load plans', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    try {
      const res = await usersApi.listOrganizers({ limit: 100 });
      setOrganizers(res.data || []);
    } catch (err) {
      console.warn('Failed to load organizers', err);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchOrganizers();
  }, []);

  const getOrganizerSociety = (u) => {
    if (!u) return 'Odoo Student Association';
    const raw = (u.name || '').trim();
    const cleaned = raw.replace(/\s+organizer$/i, '').trim();
    return cleaned || raw || 'Student Association';
  };

  const openCreate = () => {
    setEditingPlan(null);
    setName('');
    const defaultOrg = !isCollegeAdmin
      ? getOrganizerSociety(user)
      : (organizers.length > 0 ? organizers[0].name : 'Odoo Student Association');
    setOrganization(defaultOrg);
    setFee('');
    setDurationMonths('12');
    setMerchDiscountPercent('10');
    setTicketDiscountNote('Free or discounted admission to organization events');
    if (!isCollegeAdmin && user?.email) {
      setAssignedOrganizers([user.email.toLowerCase().trim()]);
    } else if (isCollegeAdmin && organizers.length > 0) {
      setAssignedOrganizers([organizers[0].email.toLowerCase().trim()]);
    } else {
      setAssignedOrganizers([]);
    }
    setCustomEmailInput('');
    setIsOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setOrganization(!isCollegeAdmin ? getOrganizerSociety(user) : (plan.organization || 'Odoo Student Association'));
    setFee(String(plan.fee));
    setDurationMonths(String(plan.duration_months || 12));
    setMerchDiscountPercent(String(plan.merch_discount_percent || 10));
    setTicketDiscountNote(plan.ticket_discount_note || '');
    setAssignedOrganizers(
      !isCollegeAdmin
        ? (user?.email ? [user.email.toLowerCase().trim()] : [])
        : Array.isArray(plan.assigned_organizers)
        ? plan.assigned_organizers
        : (plan.assigned_organizers ? [plan.assigned_organizers] : [])
    );
    setCustomEmailInput('');
    setIsOpen(true);
  };

  const handleAddEmail = () => {
    const trimmed = customEmailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!assignedOrganizers.includes(trimmed)) {
      setAssignedOrganizers((prev) => [...prev, trimmed]);
    }
    setCustomEmailInput('');
  };

  const handleRemoveEmail = (emailToRemove) => {
    setAssignedOrganizers((prev) => prev.filter((em) => em !== emailToRemove));
  };

  const handleToggleOrganizer = (email) => {
    const lower = email.toLowerCase().trim();
    if (assignedOrganizers.includes(lower)) {
      setAssignedOrganizers((prev) => prev.filter((em) => em !== lower));
    } else {
      setAssignedOrganizers((prev) => [...prev, lower]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const orgToSave = !isCollegeAdmin ? getOrganizerSociety(user) : (organization || 'Odoo Student Association');
      const organizersToSave = !isCollegeAdmin
        ? (user?.email ? [user.email.toLowerCase().trim()] : [])
        : assignedOrganizers;

      const payload = {
        name,
        organization: orgToSave,
        fee: Number(fee),
        duration_months: Number(durationMonths),
        merch_discount_percent: Number(merchDiscountPercent),
        ticket_discount_note: ticketDiscountNote,
        assigned_organizers: organizersToSave,
      };

      if (editingPlan) {
        await membershipsApi.updatePlan(editingPlan.id, payload);
        toast.success('Plan updated successfully!');
      } else {
        await membershipsApi.createPlan(payload);
        if (!isCollegeAdmin) {
          toast.success(
            'Membership plan submitted! It is now pending College Admin approval before publishing to students.'
          );
        } else {
          toast.success('Membership plan created and published!');
        }
      }

      setIsOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error(err?.message || 'Failed to save plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovePlan = async (planId) => {
    setActionInProgressId(planId);
    try {
      await membershipsApi.reviewPlanApproval(planId, 'approved');
      toast.success('Membership plan approved! It is now active and public for students.');
      fetchPlans();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve plan.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRejectPlan = async (planId) => {
    setActionInProgressId(planId);
    try {
      await membershipsApi.reviewPlanApproval(planId, 'rejected');
      toast.success('Membership plan rejected.');
      fetchPlans();
    } catch (err) {
      toast.error(err?.message || 'Failed to reject plan.');
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <PageHeader
        title="Membership Plans"
        subtitle={
          isCollegeAdmin
            ? 'Configure association tiers, assign organizer emails, and review organizer-generated plans'
            : 'Generate membership tiers for your student organization chapter (Subject to College Admin approval)'
        }
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Plans', href: isCollegeAdmin ? '/admin/plans' : '/organizer/plans' },
        ]}
        actionLabel="New Membership Plan"
        onAction={openCreate}
        actionIcon={Plus}
      />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Organizer notice banner */}
        {!isCollegeAdmin && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-ink space-y-1">
              <p className="font-semibold text-sm text-primary">Organizer Membership Generation</p>
              <p className="text-muted leading-relaxed">
                As an organizer, you can generate and submit membership plans with discount rules for your chapter.
                College Admin will review and approve your plan before it becomes publicly available for students to join.
              </p>
            </div>
          </div>
        )}

        {plans.length === 0 && !loading && (
          <Card className="p-12 text-center bg-surface border border-line">
            <Award className="h-10 w-10 text-muted mx-auto mb-3" />
            <h3 className="font-bold text-base text-ink">No Membership Plans</h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              Create your first association tier to allow students to subscribe, access member discounts, and receive perks.
            </p>
            <Button variant="primary" size="sm" onClick={openCreate} icon={Plus} className="mt-4">
              Create First Plan
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isPending = plan.approval_status === 'pending_approval';
            const isApproved = plan.approval_status === 'approved' || (!plan.approval_status && plan.is_active);
            const isRejected = plan.approval_status === 'rejected';

            const assignedEmails = Array.isArray(plan.assigned_organizers)
              ? plan.assigned_organizers
              : (plan.assigned_organizers ? [plan.assigned_organizers] : []);

            return (
              <Card
                key={plan.id}
                className={`p-6 bg-surface border rounded-lg shadow-soft flex flex-col justify-between transition-all ${
                  isPending ? 'border-amber-400/60 ring-1 ring-amber-400/20' : 'border-line'
                }`}
              >
                <div>
                  {/* Top Bar: Icon + Org Badge + Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="h-10 w-10 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5" />
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          <Clock className="h-3 w-3" /> Pending Approval
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-success/10 text-success border border-success/20">
                          <CheckCircle2 className="h-3 w-3" /> Approved & Public
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-danger/10 text-danger border border-danger/20">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}

                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20">
                        {plan.organization || 'Odoo Student Association'}
                      </span>
                    </div>
                  </div>

                  {/* Plan Name & Price */}
                  <h3 className="font-bold text-lg text-ink">{plan.name}</h3>
                  <div className="text-2xl font-extrabold text-primary my-2">
                    {formatCurrency(plan.fee)}
                  </div>

                  {/* Details & Rules */}
                  <div className="space-y-2 py-3 border-t border-line text-xs text-muted">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-semibold text-ink">
                        {plan.duration_months} Months
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Merchandise Discount:</span>
                      <span className="font-semibold text-secondary">
                        {plan.merch_discount_percent}% OFF
                      </span>
                    </div>
                    {plan.ticket_discount_note && (
                      <div className="pt-1">
                        <span className="text-[11px] block font-medium text-ink">
                          Event Perk / Discount Rule:
                        </span>
                        <p className="text-[11px] text-muted italic mt-0.5">
                          &ldquo;{plan.ticket_discount_note}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Assigned Organizers By Email: Only shown to College Admin */}
                  {isCollegeAdmin && (
                    <div className="py-2.5 border-t border-line text-xs space-y-1">
                      <span className="text-[11px] font-semibold text-muted block flex items-center gap-1">
                        <Mail className="h-3 w-3 text-primary" /> Assigned Organizer Emails:
                      </span>
                      {assignedEmails.length === 0 ? (
                        <span className="text-[11px] text-muted italic">All campus organizers</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assignedEmails.map((em, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-canvas border border-line text-ink"
                            >
                              {em}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-line space-y-2">
                  {/* College Admin Review Buttons for Pending Plans */}
                  {isCollegeAdmin && isPending && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md space-y-2">
                      <p className="text-[11px] font-medium text-amber-800 dark:text-amber-200">
                        Review Organizer-Generated Plan:
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 justify-center bg-success hover:bg-success/90 text-white"
                          icon={CheckCircle2}
                          isLoading={actionInProgressId === plan.id}
                          onClick={() => handleApprovePlan(plan.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 justify-center text-danger border-danger/30 hover:bg-danger/10"
                          icon={XCircle}
                          isLoading={actionInProgressId === plan.id}
                          onClick={() => handleRejectPlan(plan.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-2 pt-2 border-t border-line">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenMembers(plan)}
                      icon={Users}
                      className="text-xs"
                    >
                      Enrolled Students
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(plan)}
                      icon={Edit2}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Plan Creation / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingPlan ? 'Edit Membership Plan' : 'Create Membership Plan'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!isCollegeAdmin && !editingPlan && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-800 dark:text-amber-300">
              <strong>College Admin Approval Required:</strong> Once you create this plan, it will be placed in pending review until approved by College Administration.
            </div>
          )}

          <FormField label="Plan / Tier Name" required>
            <Input
              placeholder="e.g. CSI Gold Member, IEEE Student Pass"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          {isCollegeAdmin ? (
            <FormField
              label="Select Organization / Club"
              required
              hint="Select the organization/club created by your college"
            >
              {organizers.length > 0 ? (
                <Select
                  value={organization}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    setOrganization(selectedVal);
                    const matched = organizers.find(
                      (o) => o.name === selectedVal || o.email === selectedVal
                    );
                    if (matched && matched.email) {
                      const em = matched.email.toLowerCase().trim();
                      if (!assignedOrganizers.includes(em)) {
                        setAssignedOrganizers((prev) => [...prev, em]);
                      }
                    }
                  }}
                  required
                >
                  <option value="">-- Select Organization Created by Admin --</option>
                  {organizers.map((org) => (
                    <option key={org.id} value={org.name}>
                      {org.name} ({org.email})
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-md p-2.5">
                  No organizers found. Please create an organizer first in Organizers.
                </div>
              )}
            </FormField>
          ) : (
            <FormField label="Organization Chapter" required>
              <Input
                value={getOrganizerSociety(user)}
                disabled
                readOnly
                className="bg-canvas text-muted cursor-not-allowed select-none"
              />
            </FormField>
          )}

          {/* Organizer Email Assignment (Multi-Select Allowed): Only for College Admin */}
          {isCollegeAdmin && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink">
                Assign to Organizer Emails (Multiple Select Allowed)
              </label>
              <p className="text-[11px] text-muted">
                Select or type organizer emails that manage this membership (e.g. csigcet@gmail.com, ieeegcet@gmail.com).
              </p>

              {/* Quick Picker of College Organizers */}
              {organizers.length > 0 && (
                <div className="border border-line rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-canvas/40">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                    Click to select registered organizers:
                  </span>
                  {organizers.map((org) => {
                    const isChecked = assignedOrganizers.includes(org.email.toLowerCase().trim());
                    return (
                      <label
                        key={org.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-canvas text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOrganizer(org.email)}
                          className="rounded border-line text-primary focus:ring-primary"
                        />
                        <span className="font-medium text-ink">{org.name}</span>
                        <span className="text-muted font-mono text-[11px]">({org.email})</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Custom Email Input */}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Or type custom email (e.g. csi@gmail.com)"
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddEmail}>
                  Add
                </Button>
              </div>

              {/* Selected Emails Badges */}
              {assignedOrganizers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {assignedOrganizers.map((em, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-mono bg-primary/10 text-primary border border-primary/20"
                    >
                      {em}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(em)}
                        className="hover:text-danger focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Membership Fee (INR ₹)" required>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Duration (Months)" required>
              <Input
                type="number"
                min="1"
                max="60"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Merch Discount (%)" required>
              <Input
                type="number"
                min="0"
                max="100"
                value={merchDiscountPercent}
                onChange={(e) => setMerchDiscountPercent(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Event Ticket Perk / Rule" hint="Special discount or perk note for attendees">
              <Input
                placeholder="e.g. Free entry & 20% off all event tickets"
                value={ticketDiscountNote}
                onChange={(e) => setTicketDiscountNote(e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingPlan
                ? 'Save Changes'
                : isCollegeAdmin
                ? 'Create & Publish Plan'
                : 'Submit for Admin Approval'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enrolled Students for this Plan Modal */}
      <Modal
        isOpen={Boolean(viewingPlan)}
        onClose={() => setViewingPlan(null)}
        title={viewingPlan ? `Enrolled Students — ${viewingPlan.name}` : 'Enrolled Students'}
        maxWidth="max-w-4xl"
      >
        {viewingPlan && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface rounded-lg border border-line">
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-ink text-sm block">{viewingPlan.organization || 'Club'}</span>
                <span className="text-muted">
                  Fee: <strong className="text-primary">{formatCurrency(viewingPlan.fee)}</strong> • Duration:{' '}
                  {viewingPlan.duration_months} Months • Merch Discount:{' '}
                  <strong className="text-secondary">{viewingPlan.merch_discount_percent}% OFF</strong>
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="Filter student name or email..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-line bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {isLoadingPlanMembers ? (
              <div className="py-12 text-center text-muted text-xs">Loading enrolled students...</div>
            ) : (() => {
              const q = memberSearchQuery.toLowerCase().trim();
              const filtered = planMembers.filter(
                (m) =>
                  !q ||
                  (m.student_name || m.user_name || '').toLowerCase().includes(q) ||
                  (m.student_email || m.user_email || '').toLowerCase().includes(q)
              );

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-muted text-xs bg-canvas rounded-lg border border-line">
                    {planMembers.length === 0
                      ? 'No students have joined this membership plan yet.'
                      : 'No students match your filter query.'}
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto max-h-96 rounded-lg border border-line">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-canvas border-b border-line text-muted font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Student Name & Email</th>
                        <th className="py-2.5 px-3">Joined Date</th>
                        <th className="py-2.5 px-3">Valid Until</th>
                        <th className="py-2.5 px-3">Dues</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Cancellation / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-surface">
                      {filtered.map((m) => {
                        const name = m.student_name || m.user_name || 'Student';
                        const email = m.student_email || m.user_email || '';
                        return (
                          <tr key={m.id} className="hover:bg-canvas/50 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-ink">{name}</div>
                              <div className="text-[11px] text-muted">{email}</div>
                            </td>
                            <td className="py-2.5 px-3 text-muted">{formatDate(m.created_at)}</td>
                            <td className="py-2.5 px-3 text-muted">{formatDate(m.expiry_date)}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  m.dues_status === 'paid'
                                    ? 'bg-success/10 text-success'
                                    : 'bg-amber-500/10 text-amber-700'
                                }`}
                              >
                                {String(m.dues_status || 'unpaid').toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge status={m.status || 'ACTIVE'} />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {m.cancellation_status === 'pending' ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white h-7 px-2.5"
                                  onClick={() => {
                                    setCancellationTarget(m);
                                    setReviewNote('');
                                  }}
                                >
                                  Review Cancel
                                </Button>
                              ) : m.cancellation_status === 'approved' ? (
                                <span className="text-[11px] text-danger font-medium">Cancelled</span>
                              ) : m.cancellation_status === 'rejected' ? (
                                <span className="text-[11px] text-muted">Request Rejected</span>
                              ) : (
                                <span className="text-[11px] text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setViewingPlan(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Review Cancellation Request Modal */}
      <Modal
        isOpen={Boolean(cancellationTarget)}
        onClose={() => setCancellationTarget(null)}
        title="Review Membership Cancellation Request"
        maxWidth="max-w-md"
      >
        {cancellationTarget && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                Student Cancellation Request
              </div>
              <p className="text-muted">
                <strong className="text-ink">
                  {cancellationTarget.student_name || cancellationTarget.user_name}
                </strong>{' '}
                requested cancellation for <strong className="text-ink">{viewingPlan?.name}</strong>.
              </p>
              {cancellationTarget.cancellation_reason && (
                <div className="mt-2 p-2 bg-white/70 dark:bg-black/20 rounded border border-amber-500/20 text-ink">
                  <span className="font-semibold block text-[11px] text-muted">Student Reason:</span>
                  &ldquo;{cancellationTarget.cancellation_reason}&rdquo;
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Review Note (Optional)</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Reason or feedback for approving or rejecting this request..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-md border border-line bg-canvas text-ink focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancellationTarget(null)}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-danger border-danger/30 hover:bg-danger/10"
                onClick={() => handleReviewCancellation('reject')}
                disabled={isSubmittingReview}
              >
                Reject Request
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-danger hover:bg-danger/90 text-white"
                onClick={() => handleReviewCancellation('approve')}
                isLoading={isSubmittingReview}
              >
                Approve Cancellation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Plans;
