import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { organizersApi } from '@/api/organizers';
import { formatDateTime } from '@/utils/format';

export const Organizers = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // New Organizer Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleToggleAccess = async (organizer) => {
    try {
      await organizersApi.toggleAccess(organizer.id);
      toast.success(`Access updated for ${organizer.name}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to toggle access.');
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
      toast.success('Organizer removed.');
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
        <div>
          <span className="font-bold text-ink">{row.name}</span>
          <span className="block text-xs text-muted">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Access Allowed',
      render: (row) => (
        <Switch
          checked={Boolean(row.is_active)}
          onChange={() => handleToggleAccess(row)}
        />
      ),
    },
    {
      key: 'created_at',
      header: 'Created On',
      render: (row) => formatDateTime(row.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <IconButton
          variant="danger"
          size="sm"
          icon={Trash2}
          onClick={() => setDeleteTarget(row)}
          title="Delete Organizer"
        />
      ),
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
        title="Remove Organizer"
        description={`Are you sure you want to delete ${deleteTarget?.name}? They will lose event organizer and gate scanner privileges.`}
        confirmText="Remove"
        variant="danger"
      />
    </>
  );
};

export default Organizers;
