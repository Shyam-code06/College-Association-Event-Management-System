import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2, Building } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Switch } from '@/components/ui/Switch';
import { IconButton } from '@/components/ui/IconButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { superAdminApi } from '@/api/superAdmin';
import { formatDateTime } from '@/utils/format';

export const CollegeAdmins = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  // Toggle Confirm
  const [toggleTarget, setToggleTarget] = useState(null);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const confirmToggleAccess = async () => {
    if (!toggleTarget) return;
    try {
      await superAdminApi.toggleAccess(toggleTarget.id);
      toast.success(`Access updated for ${toggleTarget.name}`);
      setToggleTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to toggle access.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await superAdminApi.deleteCollegeAdmin(deleteTarget.id);
      toast.success('College administrator removed.');
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete college admin.');
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
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Building className="h-4 w-4 text-primary" />
          <span className="font-semibold text-ink">
            {row.college_name || `College #${row.college_id}`}
          </span>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Active Status',
      render: (row) => (
        <Switch
          checked={Boolean(row.is_active)}
          onChange={() => setToggleTarget(row)}
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
          title="Delete Admin"
        />
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

      {/* Confirm Access Toggle */}
      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={confirmToggleAccess}
        title="Change Admin Access"
        description={`Are you sure you want to ${
          toggleTarget?.is_active ? 'deactivate' : 'activate'
        } access for ${toggleTarget?.name}?`}
        confirmText="Confirm Change"
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete College Admin"
        description={`Are you sure you want to permanently delete ${deleteTarget?.name}? This action cannot be undone.`}
        confirmText="Delete Admin"
        variant="danger"
      />
    </>
  );
};

export default CollegeAdmins;
