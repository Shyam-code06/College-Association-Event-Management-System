import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Award, Edit2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { membershipsApi } from '@/api/memberships';
import { formatCurrency } from '@/utils/format';

export const Plans = () => {
  const [plans, setPlans] = useState([]);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');
  const [durationMonths, setDurationMonths] = useState('12');
  const [merchDiscountPercent, setMerchDiscountPercent] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await membershipsApi.getPlans();
      setPlans(res.data || []);
    } catch (err) {
      console.error('Failed to load plans', err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreate = () => {
    setEditingPlan(null);
    setName('');
    setFee('');
    setDurationMonths('12');
    setMerchDiscountPercent('10');
    setIsOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setFee(String(plan.fee));
    setDurationMonths(String(plan.duration_months || 12));
    setMerchDiscountPercent(String(plan.merch_discount_percent || 10));
    setIsOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        fee: Number(fee),
        duration_months: Number(durationMonths),
        merch_discount_percent: Number(merchDiscountPercent),
      };

      if (editingPlan) {
        await membershipsApi.updatePlan(editingPlan.id, payload);
        toast.success('Plan updated!');
      } else {
        await membershipsApi.createPlan(payload);
        toast.success('Plan created!');
      }

      setIsOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error(err?.message || 'Failed to save plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <PageHeader
        title="Membership Plans"
        subtitle="Configure association membership tiers, duration, fees, and perks"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Plans', href: '/admin/plans' },
        ]}
        actionLabel="New Plan"
        onAction={openCreate}
        actionIcon={Plus}
      />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="p-6 bg-surface border border-line rounded-lg shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-md bg-primary-soft text-primary flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(plan)}
                    icon={Edit2}
                  >
                    Edit
                  </Button>
                </div>

                <h3 className="font-bold text-lg text-ink">{plan.name}</h3>
                <div className="text-2xl font-extrabold text-primary my-2">
                  {formatCurrency(plan.fee)}
                </div>

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
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Plan Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingPlan ? 'Edit Membership Plan' : 'Create Membership Plan'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Plan Name" required>
            <Input
              placeholder="e.g. Gold Association Member"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Membership Fee (INR ₹)" required>
            <Input
              type="number"
              placeholder="e.g. 500"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duration (Months)" required>
              <Input
                type="number"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Merch Discount (%)" required>
              <Input
                type="number"
                value={merchDiscountPercent}
                onChange={(e) => setMerchDiscountPercent(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Plans;
