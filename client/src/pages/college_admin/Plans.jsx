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
import { formatCurrency } from '@/utils/format';

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

                  <div className="flex justify-end gap-2">
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
    </div>
  );
};

export default Plans;
