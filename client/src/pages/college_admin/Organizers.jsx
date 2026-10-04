import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, CheckCircle2, ShieldAlert, UserX, CheckCheck, KeyRound } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { organizersApi } from '@/api/organizers';
import { usersApi } from '@/api/users';
import { formatDateTime } from '@/utils/format';

export const Organizers = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [processingId, setProcessingId] = useState(null);
  const [isApprovingAll, setIsApprovingAll] = useState(false);

  // New Organizer Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Reset Password Modal
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('123456');
  const [isResetting, setIsResetting] = useState(false);

  const handleOpenResetModal = (organizer) => {
    setResetTarget(organizer);
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
      await organizersApi.resetPassword(resetTarget.id, pwd);
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

  const handleToggleAccess = async (organizer, desiredStatus) => {
    setProcessingId(organizer.id);
    const currentActive = Boolean(organizer.isActive ?? organizer.is_active);
    const newStatus = typeof desiredStatus === 'boolean' ? desiredStatus : !currentActive;
    try {
      await organizersApi.toggleAccess(organizer.id, newStatus);
      if (newStatus) {
        toast.success(`Access approved and activated for ${organizer.name}`);
      } else {
        toast.success(`Access deactivated for ${organizer.name}`);
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to toggle access.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAll = async () => {
    setIsApprovingAll(true);
    try {
      const res = await usersApi.approveAll('organizer');
      const count = res?.data?.updatedCount ?? res?.updatedCount ?? 0;
      if (count > 0) {
        toast.success(`Approved and activated ${count} organizer account${count === 1 ? '' : 's'}!`);
      } else {
        toast.success('All organizer accounts are already approved.');
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to approve organizers.');
    } finally {
      setIsApprovingAll(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      toast.error('All fields are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await organizersApi.create({
        name: newName,
        email: newEmail,
        password: newPassword,
      });
      toast.success('Organizer account created!');
      setIsCreateOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to create organizer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await organizersApi.remove(deleteTarget.id);
      toast.success(`Organizer ${deleteTarget.name} removed successfully.`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to remove organizer.');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Organizer Name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-pill bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {(row.name || 'O').charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-ink block">{row.name}</span>
            <span className="text-xs text-muted block">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Approval Status',
      render: (row) => {
        const isActive = Boolean(row.isActive ?? row.is_active);
        return (
          <div>
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-success/15 text-success text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active / Approved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-warning/15 text-warning text-xs font-semibold">
                <ShieldAlert className="h-3.5 w-3.5" />
                Deactivated / Inactive
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'is_active',
      header: 'Access Allowed',
      render: (row) => {
        const isActive = Boolean(row.isActive ?? row.is_active);
        return (
          <Switch
            checked={isActive}
            onChange={() => handleToggleAccess(row)}
            disabled={processingId === row.id}
          />
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created On',
      render: (row) => formatDateTime(row.created_at || row.createdAt),
    },
    {
      key: 'actions',
      header: 'Account Actions',
      render: (row) => {
        const isActive = Boolean(row.isActive ?? row.is_active);
        return (
          <div className="flex items-center gap-2">
            {!isActive ? (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                isLoading={processingId === row.id}
                onClick={() => handleToggleAccess(row, true)}
                className="bg-success hover:bg-success/90 text-white"
              >
                Approve
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                icon={UserX}
                isLoading={processingId === row.id}
                onClick={() => handleToggleAccess(row, false)}
                className="text-danger hover:bg-danger/10 border-danger/30"
              >
                Deactivate
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              icon={KeyRound}
              onClick={() => handleOpenResetModal(row)}
              title="Reset Organizer Password (default: 123456)"
              className="text-xs text-ink hover:text-primary hover:border-primary"
            >
              Reset Password
            </Button>

            <IconButton
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setDeleteTarget(row)}
              title="Delete Organizer"
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Event Organizers"
        subtitle="Manage association committee leaders with gate scanner & event privileges"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Organizers', href: '/admin/organizers' },
        ]}
        api={organizersApi.list}
        columns={columns}
        actionLabel="New Organizer"
        onAction={() => setIsCreateOpen(true)}
        actionIcon={Plus}
        searchPlaceholder="Search organizers..."
        actions={
          <Button
            variant="outline"
            size="md"
            icon={CheckCheck}
            isLoading={isApprovingAll}
            onClick={handleApproveAll}
            className="border-success/40 text-success hover:bg-success/10"
          >
            Approve All Organizers
          </Button>
        }
      />

      {/* Create Organizer Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Event Organizer"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Full Name" required>
            <Input
              placeholder="e.g. Rahul Verma"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="College Email" required>
            <Input
              type="email"
              placeholder="rahul@skyline.edu"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Initial Password" required>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Organizer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Organizer"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? They will permanently lose event organizer and gate scanner privileges.`}
        confirmLabel="Delete Organizer"
        variant="danger"
      />

      {/* Reset Password Modal */}
      <Modal
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title="Reset Organizer Password"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 bg-canvas border border-line rounded-md text-xs text-muted space-y-1">
            <p className="font-semibold text-ink">
              Organizer: {resetTarget?.name}
            </p>
            <p className="font-mono text-[11px] text-muted truncate">
              {resetTarget?.email}
            </p>
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
    </>
  );
};

export default Organizers;
