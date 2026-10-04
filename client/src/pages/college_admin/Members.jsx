import React, { useState, useEffect, useMemo } from 'react';
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
  GraduationCap,
  Search,
  CheckSquare,
  Square,
  Users
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
import { useAuthStore } from '@/stores/auth';
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
  const { user } = useAuthStore();
  const isOrganizer = user?.role === 'organizer';

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

  // Form states for Add Membership (multi-student selection allowed)
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(
    isOrganizer && user?.name?.toLowerCase().includes('csi')
      ? 'CSI'
      : isOrganizer && user?.name?.toLowerCase().includes('ieee')
      ? 'IEEE Student Branch'
      : 'Odoo Student Association'
  );
  const [customOrg, setCustomOrg] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [durationMonths, setDurationMonths] = useState('12');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.enrollment_number?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const toggleStudent = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredStudents.map((s) => s.id);
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
  };

  // Load students & plans when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      setIsLoadingOptions(true);
      Promise.all([
        usersApi.listStudents({ limit: 200 }),
        membershipsApi.getPlans(),
      ])
        .then(([usersRes, plansRes]) => {
          const studentList = usersRes?.data || [];
          const plansList = plansRes?.data || [];
          setStudents(studentList);
          setPlans(plansList);

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
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one student to grant membership.');
      return;
    }
    if (!selectedPlanId) {
      toast.error('Please select a membership tier / plan.');
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
        userIds: selectedUserIds.map(Number),
        planId: Number(selectedPlanId),
        organization: orgToSave,
        durationMonths: Number(durationMonths) || 12,
        status: 'active',
        duesStatus: 'paid',
      });

      toast.success(
        `Membership successfully granted to ${selectedUserIds.length} student(s) for ${orgToSave}!`
      );
      setIsAddModalOpen(false);
      setSelectedUserIds([]);
      setStudentSearch('');
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
      render: (row) => <span className="font-mono font-semibold text-primary">{row.id}</span>,
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
          {
            label: 'Members',
            href: isOrganizer ? '/organizer/members' : '/admin/members',
          },
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
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAddMembership} className="space-y-4">
          <p className="text-xs text-muted -mt-1 mb-2">
            Select one or more students to grant membership passes with verified association privileges.
          </p>

          {/* Student Multi-Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                Select Students <span className="text-danger">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-muted">
                  {selectedUserIds.length} of {students.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-muted text-[11px]">•</span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-[11px] font-semibold text-muted hover:text-ink hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search Input for filtering students */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students by name, email, or enrollment..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-canvas border border-line rounded-md text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Scrollable checklist */}
            <div className="border border-line rounded-md max-h-48 overflow-y-auto bg-surface divide-y divide-line/60">
              {isLoadingOptions ? (
                <div className="text-xs text-muted p-4 text-center">Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-xs text-muted p-4 text-center">
                  {students.length === 0 ? 'No registered students found' : 'No students match your search'}
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const isChecked = selectedUserIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleStudent(s.id)}
                      className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer select-none transition-colors ${
                        isChecked
                          ? 'bg-primary-soft/40 hover:bg-primary-soft/60'
                          : 'hover:bg-canvas'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-muted shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-ink truncate">{s.name}</p>
                          <p className="text-[11px] text-muted truncate">
                            {s.email}
                            {s.enrollment_number ? ` • ${s.enrollment_number}` : ''}
                          </p>
                        </div>
                      </div>
                      {s.department && (
                        <span className="text-[10px] text-muted px-1.5 py-0.5 rounded bg-canvas border border-line shrink-0">
                          {s.department}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

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
              This will activate membership passes for all {selectedUserIds.length} selected student(s) immediately with paid dues and grant full association perks.
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
              disabled={selectedUserIds.length === 0 || !selectedPlanId}
              icon={Plus}
            >
              Add Membership ({selectedUserIds.length})
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
