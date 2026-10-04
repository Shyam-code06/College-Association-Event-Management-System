import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Building, KeyRound } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { superAdminApi } from '@/api/superAdmin';
import { formatDateTime } from '@/utils/format';

export const CollegeAdmins = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  // Toggle Confirm (Deactivate / Activate)
  const [toggleTarget, setToggleTarget] = useState(null);

  // Reset Password Modal
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('123456');
  const [isResetting, setIsResetting] = useState(false);

  const handleOpenResetModal = (admin) => {
    setResetTarget(admin);
    setResetPasswordValue('123456');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTarget) return;
    const pwd = resetPasswordValue.trim() || '123456';
    if (pwd.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsResetting(true);
    try {
      await superAdminApi.resetPassword(resetTarget.id, pwd);
      toast.success(
        `Password reset to "${pwd}" for ${resetTarget.name} (${resetTarget.email})!`
      );
      setResetTarget(null);
      setResetPasswordValue('123456');
    } catch (err) {
      toast.error(err?.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  const confirmToggleAccess = async () => {
    if (!toggleTarget) return;
    try {
      const currentActive = Boolean(toggleTarget.is_active ?? toggleTarget.isActive);
      const nextState = !currentActive;
      await superAdminApi.toggleAccess(toggleTarget.id, { isActive: nextState });
      toast.success(
        nextState
          ? `Access activated for ${toggleTarget.name}`
          : `Access deactivated for ${toggleTarget.name}`
      );
      setToggleTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to update access status.');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Admin Details',
      render: (row) => (
        <div>
          <span className="font-bold text-ink">{row.name}</span>
          <span className="block text-xs text-muted">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'college_name',
      header: 'Assigned College',
      render: (row) => {
        const collegeName = row.college_name || row.college?.name;
        const collegeId = row.college_id || row.college?.id;
        return (
          <div className="flex items-center gap-1.5">
            <Building className="h-4 w-4 text-primary" />
            <span className="font-semibold text-ink">
              {collegeName || (collegeId ? `College #${collegeId}` : 'No College Assigned')}
            </span>
          </div>
        );
      },
    },
    {
      key: 'is_active',
      header: 'Active Status',
      render: (row) => (
        <Switch
          checked={Boolean(row.is_active ?? row.isActive)}
          onChange={() => setToggleTarget(row)}
        />
      ),
    },
    {
      key: 'created_at',
      header: 'Created On',
      render: (row) => formatDateTime(row.created_at || row.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          icon={KeyRound}
          onClick={() => handleOpenResetModal(row)}
          title="Reset College Admin Password"
          className="text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 gap-1.5 whitespace-nowrap"
        >
          Reset Password
        </Button>
      ),
    },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="College Administrators"
        subtitle="Super Admin governance: provision and oversee institutional administrator accounts"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'College Admins', href: '/super-admin/college-admins' },
        ]}
        api={superAdminApi.getCollegeAdmins}
        columns={columns}
        actionLabel="Create College Admin"
        onAction={() => navigate('/super-admin/college-admins/new')}
        actionIcon={Plus}
        searchPlaceholder="Search administrators..."
      />

      {/* Reset Password Modal */}
      <Modal
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title="Reset College Admin Password"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 bg-canvas border border-line rounded-md text-xs text-muted space-y-1">
            <p className="font-semibold text-ink">
              Administrator: {resetTarget?.name}
            </p>
            <p className="font-mono text-[11px] text-muted truncate">
              {resetTarget?.email}
            </p>
            {(resetTarget?.college_name || resetTarget?.college?.name) && (
              <p className="text-[11px] text-primary font-medium">
                {resetTarget.college_name || resetTarget.college?.name}
              </p>
            )}
          </div>

          <FormField
            label="New Password"
            required
            hint="Default is 123456. You can keep it or enter a custom password."
          >
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="123456"
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                required
                minLength={6}
              />
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted text-[11px]">Quick default:</span>
                <button
                  type="button"
                  onClick={() => setResetPasswordValue('123456')}
                  className="text-primary hover:underline font-semibold text-xs"
                >
                  Set to 123456
                </button>
              </div>
            </div>
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isResetting}
              icon={KeyRound}
            >
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Access Toggle (Deactivate / Activate) */}
      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={confirmToggleAccess}
        title="Change Admin Access"
        description={`Are you sure you want to ${
          (toggleTarget?.is_active ?? toggleTarget?.isActive) ? 'deactivate' : 'activate'
        } access for ${toggleTarget?.name}?`}
        confirmText="Confirm Change"
      />
    </>
  );
};

export default CollegeAdmins;
