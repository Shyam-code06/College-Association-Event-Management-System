import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  Building2,
  Filter,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { membershipsApi } from '@/api/memberships';
import { usersApi } from '@/api/users';
import { formatDate } from '@/utils/format';

const PRESET_ORGANIZATIONS = [
  'Odoo Student Association',
  'CSI',
  'IEEE Student Branch',
  'ACM Student Chapter',
  'GDSC',
  'Other',
];

export const Members = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('');

  // Verification modal
  const [verifyData, setVerifyData] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Membership Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Form states for Add Membership
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('Odoo Student Association');
  const [customOrg, setCustomOrg] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [durationMonths, setDurationMonths] = useState('12');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load students & plans when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      setIsLoadingOptions(true);
      Promise.all([
        usersApi.listStudents({ limit: 100 }),
        membershipsApi.getPlans(),
      ])
        .then(([usersRes, plansRes]) => {
          const studentList = usersRes?.data || [];
          const plansList = plansRes?.data || [];
          setStudents(studentList);
          setPlans(plansList);

          if (studentList.length > 0 && !selectedUserId) {
            setSelectedUserId(String(studentList[0].id));
          }
          if (plansList.length > 0 && !selectedPlanId) {
            setSelectedPlanId(String(plansList[0].id));
          }
        })
        .catch((err) => {
          console.error('Failed to load students or plans', err);
          toast.error('Failed to load student or plan options');
        })
        .finally(() => {
          setIsLoadingOptions(false);
        });
    }
  }, [isAddModalOpen]);

  const handleVerify = async (memberId) => {
    try {
      const res = await membershipsApi.verifyMembership(memberId);
      setVerifyData(res.data);
      setIsVerifyModalOpen(true);
    } catch (err) {
      toast.error(err?.message || 'Failed to verify membership pass.');
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await membershipsApi.deleteMember(deleteTarget.id);
      toast.success(
        `Membership #${deleteTarget.id} for ${deleteTarget.student_name || deleteTarget.user_name || 'student'} deleted successfully.`
      );
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete membership.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMembership = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !selectedPlanId) {
      toast.error('Please select both a student and a membership plan.');
      return;
    }

    const orgToSave =
      selectedOrg === 'Other' ? customOrg.trim() : selectedOrg;

    if (!orgToSave) {
      toast.error('Please specify the student organization name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await membershipsApi.adminCreate({
        userId: Number(selectedUserId),
        planId: Number(selectedPlanId),
        organization: orgToSave,
        durationMonths: Number(durationMonths) || 12,
        status: 'active',
        duesStatus: 'paid',
      });

      toast.success(`Membership added successfully for ${orgToSave}!`);
      setIsAddModalOpen(false);
      setSelectedUserId('');
      setCustomOrg('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to add student membership.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOrgBadgeStyle = (org) => {
    const o = (org || '').toLowerCase();
    if (o.includes('odoo')) {
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40';
    }
    if (o.includes('csi')) {
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
    }
    if (o.includes('ieee')) {
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40';
    }
    if (o.includes('acm')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40';
    }
    if (o.includes('gdsc')) {
      return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
  };

  const columns = [
    {
      key: 'id',
      header: 'Member ID',
      render: (row) => <span className="font-mono font-semibold text-primary">#{row.id}</span>,
    },
    {
      key: 'student_name',
      header: 'Student',
      render: (row) => {
        const name = row.student_name || row.user_name || row.name || 'Registered Student';
        const email = row.student_email || row.user_email || row.email || '';
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-pill bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-ink block">{name}</span>
              {email && <span className="block text-xs text-muted truncate max-w-[200px]">{email}</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'organization',
      header: 'Student Organization',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold border ${getOrgBadgeStyle(
            row.organization
          )}`}
        >
          <Building2 className="h-3 w-3" />
          {row.organization || 'Odoo Student Association'}
        </span>
      ),
    },
    {
      key: 'plan_name',
      header: 'Association Tier',
      render: (row) => (
        <span className="font-semibold text-primary">
          {row.plan_name || 'Standard Tier'}
        </span>
      ),
    },
    {
      key: 'expiry_date',
      header: 'Valid Until',
      render: (row) => formatDate(row.expiry_date),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge status={row.status || 'ACTIVE'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVerify(row.id)}
            icon={ShieldCheck}
            className="text-xs"
          >
            Verify
          </Button>

          <IconButton
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setDeleteTarget(row)}
            title="Delete Membership"
          />
        </div>
      ),
    },
  ];

  const organizationFilter = (
    <div className="flex items-center gap-1.5">
      <Filter className="h-3.5 w-3.5 text-muted" />
      <select
        value={selectedOrgFilter}
        onChange={(e) => {
          setSelectedOrgFilter(e.target.value);
          setRefreshKey((k) => k + 1);
        }}
        className="text-xs bg-canvas border border-line rounded-md px-2.5 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">All Organizations</option>
        <option value="Odoo Student Association">Odoo Student Association</option>
        <option value="CSI">CSI</option>
        <option value="IEEE Student Branch">IEEE Student Branch</option>
        <option value="ACM Student Chapter">ACM Student Chapter</option>
        <option value="GDSC">GDSC</option>
      </select>
    </div>
  );

  return (
    <>
      <ResourceListPage
        key={`${refreshKey}-${selectedOrgFilter}`}
        title="Student Memberships"
        subtitle="Manage student association passes, organization affiliations, and gate privileges"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Members', href: '/admin/members' },
        ]}
        api={(params) =>
          membershipsApi.listMembers({
            ...params,
            organization: selectedOrgFilter || undefined,
          })
        }
        columns={columns}
        searchPlaceholder="Search by student, email, or organization..."
        actionLabel="Add Membership"
        onAction={() => setIsAddModalOpen(true)}
        actionIcon={Plus}
        filterComponent={organizationFilter}
        emptyTitle="No memberships found"
        emptyDescription="Add memberships for students across Odoo Student Association, CSI, IEEE, and more."
      />

      {/* Add Membership Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Student Membership"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddMembership} className="space-y-4">
          <p className="text-xs text-muted -mt-1 mb-3">
            Assign a student to an association membership pass with verified privileges.
          </p>

          {/* Student Selector */}
          <FormField label="Select Student" required>
            {isLoadingOptions ? (
              <div className="text-xs text-muted py-2">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="text-xs text-danger py-1">
                No registered students found. Register students first.
              </div>
            ) : (
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
              >
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          {/* Organization Selection: "Which organization do you want to add membership for?" */}
          <FormField
            label="Which organization do you want to add membership for?"
            required
            hint="Choose the student club or organization chapter granting this pass"
          >
            <Select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              required
            >
              {PRESET_ORGANIZATIONS.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </Select>
          </FormField>

          {selectedOrg === 'Other' && (
            <FormField label="Custom Organization Name" required>
              <Input
                placeholder="e.g. Robotics Club or SAE Collegiate"
                value={customOrg}
                onChange={(e) => setCustomOrg(e.target.value)}
                required
              />
            </FormField>
          )}

          {/* Plan / Tier Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Membership Tier / Plan" required>
              {plans.length === 0 ? (
                <div className="text-xs text-danger py-1">No plans available</div>
              ) : (
                <Select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  required
                >
                  <option value="">-- Select Tier --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.fee})
                    </option>
                  ))}
                </Select>
              )}
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

          <div className="p-3 bg-canvas border border-line rounded-md text-xs text-muted flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              This will activate the student&apos;s membership pass immediately with paid dues and grant full association perks.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={Plus}
            >
              Add Membership
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteMember}
        isLoading={isDeleting}
        title="Delete Student Membership"
        description={`Are you sure you want to delete the "${deleteTarget?.plan_name}" membership for ${
          deleteTarget?.student_name || deleteTarget?.user_name || 'this student'
        } in "${deleteTarget?.organization || 'the organization'}"? This membership pass and its perks will be permanently revoked.`}
        confirmLabel="Delete Membership"
        variant="danger"
      />

      {/* Verification Details Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Membership Verification Badge"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-pill bg-success/10 text-success flex items-center justify-center mx-auto">
            <UserCheck className="h-8 w-8" />
          </div>

          <div>
            <h4 className="font-bold text-base text-ink">
              {verifyData?.student_name || verifyData?.user?.name || 'Verified Member'}
            </h4>
            <p className="text-xs text-muted mt-0.5">
              {verifyData?.student_email || verifyData?.user?.email}
            </p>
          </div>

          <div className="p-3 bg-canvas border border-line rounded-md text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">Membership Tier:</span>
              <span className="font-bold text-ink">{verifyData?.plan_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Expiry Date:</span>
              <span className="font-semibold text-ink">
                {formatDate(verifyData?.expiry_date || verifyData?.expiryDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Status:</span>
              <Badge status={verifyData?.status || 'ACTIVE'} />
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full justify-center"
            onClick={() => setIsVerifyModalOpen(false)}
          >
            Done
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default Members;
