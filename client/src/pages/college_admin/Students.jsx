import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldAlert, CheckCircle2, UserX, Trash2, CheckCheck } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Switch } from '@/components/ui/Switch';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usersApi } from '@/api/users';
import { formatDate } from '@/utils/format';

export const Students = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [processingId, setProcessingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);

  const handleToggleStatus = async (student, desiredStatus) => {
    setProcessingId(student.id);
    const newStatus = typeof desiredStatus === 'boolean' ? desiredStatus : !student.isActive;
    try {
      await usersApi.toggleStatus(student.id, newStatus);
      if (newStatus) {
        toast.success(`Account approved and activated for ${student.name}`);
      } else {
        toast.success(`Account deactivated for ${student.name}`);
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to update student account status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await usersApi.remove(deleteTarget.id);
      toast.success(`Student account for ${deleteTarget.name} has been deleted.`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete student account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApproveAll = async () => {
    setIsApprovingAll(true);
    try {
      const res = await usersApi.approveAll('student');
      const count = res?.data?.updatedCount ?? res?.updatedCount ?? 0;
      if (count > 0) {
        toast.success(`Approved and activated ${count} pending student account${count === 1 ? '' : 's'}!`);
      } else {
        toast.success('All student accounts are already approved.');
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to approve pending students.');
    } finally {
      setIsApprovingAll(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Student ID',
      render: (row) => <span className="font-mono font-semibold text-primary">#{row.id}</span>,
    },
    {
      key: 'name',
      header: 'Student Name & Email',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-pill bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {(row.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-ink block">{row.name}</span>
            <span className="text-xs text-muted block">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Registered Date',
      render: (row) => formatDate(row.createdAt || row.created_at),
    },
    {
      key: 'isActive',
      header: 'Approval Status',
      render: (row) => (
        <div>
          {row.isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-success/15 text-success text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Active / Approved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-warning/15 text-warning text-xs font-semibold">
              <ShieldAlert className="h-3.5 w-3.5" />
              Pending Approval / Inactive
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'toggle',
      header: 'Active Switch',
      render: (row) => (
        <Switch
          checked={Boolean(row.isActive)}
          onChange={() => handleToggleStatus(row)}
          disabled={processingId === row.id}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Account Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {!row.isActive ? (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              isLoading={processingId === row.id}
              onClick={() => handleToggleStatus(row, true)}
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
              onClick={() => handleToggleStatus(row, false)}
              className="text-danger hover:bg-danger/10 border-danger/30"
            >
              Deactivate
            </Button>
          )}

          <IconButton
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setDeleteTarget(row)}
            title="Delete Student Account"
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Total Students"
        subtitle="Complete list of registered students, account approval requests, and active access controls"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Students', href: '/admin/students' },
        ]}
        api={usersApi.listStudents}
        columns={columns}
        searchPlaceholder="Search students by name or email..."
        emptyTitle="No students registered"
        emptyDescription="Newly registered students will appear here for verification and approval."
        actions={
          <Button
            variant="primary"
            size="md"
            icon={CheckCheck}
            isLoading={isApprovingAll}
            onClick={handleApproveAll}
            className="bg-success hover:bg-success/90 text-white"
          >
            Approve All Pending
          </Button>
        }
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteStudent}
        isLoading={isDeleting}
        title="Delete Student Account"
        description={`Are you sure you want to delete the student account for "${deleteTarget?.name}" (${deleteTarget?.email})? This action cannot be undone.`}
        confirmLabel="Delete Account"
        variant="danger"
      />
    </>
  );
};

export default Students;
