import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { membershipsApi } from '@/api/memberships';
import { formatDate } from '@/utils/format';

export const Members = () => {
  const [verifyData, setVerifyData] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const handleVerify = async (memberId) => {
    try {
      const res = await membershipsApi.verifyMembership(memberId);
      setVerifyData(res.data);
      setIsVerifyModalOpen(true);
    } catch (err) {
      toast.error(err?.message || 'Failed to verify membership pass.');
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Member ID',
      render: (row) => <span className="font-mono font-semibold">#{row.id}</span>,
    },
    {
      key: 'student_name',
      header: 'Student',
      render: (row) => (
        <div>
          <span className="font-bold text-ink">{row.student_name || row.name}</span>
          <span className="block text-xs text-muted">{row.student_email || row.email}</span>
        </div>
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
      header: 'Verification',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleVerify(row.id)}
          icon={ShieldCheck}
        >
          Verify
        </Button>
      ),
    },
  ];

  return (
    <>
      <ResourceListPage
        title="Student Memberships"
        subtitle="Active and expired student association member passes"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Members', href: '/admin/members' },
        ]}
        api={membershipsApi.listMembers}
        columns={columns}
        searchPlaceholder="Search members by name or email..."
      />

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
              {verifyData?.student_name || 'Verified Member'}
            </h4>
            <p className="text-xs text-muted mt-0.5">{verifyData?.student_email}</p>
          </div>

          <div className="p-3 bg-canvas border border-line rounded-md text-xs text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted">Membership Tier:</span>
              <span className="font-bold text-ink">{verifyData?.plan_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Expiry Date:</span>
              <span className="font-semibold text-ink">
                {formatDate(verifyData?.expiry_date)}
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
