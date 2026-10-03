import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { paymentsApi } from '@/api/payments';
import { formatCurrency, formatDateTime } from '@/utils/format';

export const PendingPayments = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProcess = async (paymentId, shouldSucceed) => {
    try {
      await paymentsApi.process(paymentId, shouldSucceed);
      toast.success(shouldSucceed ? 'Payment approved!' : 'Payment marked as rejected.');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to process payment.');
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Payment #',
      render: (row) => <span className="font-mono font-semibold">#{row.id}</span>,
    },
    {
      key: 'user_name',
      header: 'Student / User',
      render: (row) => (
        <div>
          <span className="font-bold text-ink">{row.user_name || 'Student'}</span>
          <span className="block text-xs text-muted">{row.user_email}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className="font-extrabold text-primary">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'payment_type',
      header: 'Type / Purpose',
      render: (row) => (
        <span className="text-xs font-semibold capitalize text-muted">
          {row.payment_type || 'Association Dues'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge status={row.status || 'PENDING'} />,
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (row) => formatDateTime(row.created_at),
    },
    {
      key: 'actions',
      header: 'Review Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleProcess(row.id, true)}
            icon={Check}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-danger border-danger/30 hover:bg-danger/10"
            onClick={() => handleProcess(row.id, false)}
            icon={X}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ResourceListPage
      key={refreshKey}
      title="Pending Payment Clearances"
      subtitle="Manually audit and approve offline transfers or cash receipts"
      breadcrumbs={[
        { label: 'Apps', href: '/apps' },
        { label: 'Pending Payments', href: '/admin/payments' },
      ]}
      api={paymentsApi.getPending}
      columns={columns}
      searchPlaceholder="Search payments..."
      emptyTitle="No pending payments"
      emptyDescription="All incoming transactions have been cleared."
    />
  );
};

export default PendingPayments;
