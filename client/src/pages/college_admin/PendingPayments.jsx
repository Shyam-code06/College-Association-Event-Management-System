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
  const [activeTab, setActiveTab] = useState('all');

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
      header: 'Payment ID',
      render: (row) => <span className="font-mono font-semibold">#{row.id}</span>,
    },
    {
      key: 'user_name',
      header: 'Student / User',
      render: (row) => {
        const name = row.user_name || row.student_name || 'Student';
        const email = row.user_email || row.student_email;
        return (
          <div>
            <span className="font-bold text-ink">{name}</span>
            {email && <span className="block text-xs text-muted">{email}</span>}
          </div>
        );
      },
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
      render: (row) => {
        const statusLabel =
          row.status === 'success' ? 'Approved' :
          row.status === 'pending' ? 'Pending' :
          row.status === 'failed' ? 'Rejected' :
          row.status || 'PENDING';
        return <Badge status={statusLabel} />;
      },
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (row) => formatDateTime(row.created_at),
    },
    {
      key: 'actions',
      header: 'Review Actions',
      render: (row) => {
        if (row.status === 'success' || row.status === 'approved') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              Approved
            </span>
          );
        }

        if (row.status === 'failed' || row.status === 'rejected') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
              <X className="w-3.5 h-3.5" />
              Rejected
            </span>
          );
        }

        return (
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
        );
      },
    },
  ];

  const filterTabs = [
    { id: 'all', label: 'All Payments' },
    { id: 'approved', label: 'Approved Payments' },
    { id: 'pending', label: 'Pending Clearances' },
  ];

  const headerChildren = (
    <div className="flex items-center gap-2 border-b border-line pb-3">
      {filterTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-ink hover:bg-canvas-2 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const getEmptyConfig = () => {
    if (activeTab === 'pending') {
      return {
        title: 'No pending payments',
        desc: 'All incoming transactions have been cleared.',
      };
    }
    if (activeTab === 'approved') {
      return {
        title: 'No approved payments yet',
        desc: 'Cleared or approved transactions will be shown here.',
      };
    }
    return {
      title: 'No payment records found',
      desc: 'No student transactions have been recorded yet.',
    };
  };

  const emptyConfig = getEmptyConfig();

  return (
    <ResourceListPage
      key={`${activeTab}-${refreshKey}`}
      title="Payment Clearances"
      subtitle="Audit, approve, and verify incoming student transactions and receipts"
      breadcrumbs={[
        { label: 'Apps', href: '/apps' },
        { label: 'Payments', href: '/admin/payments' },
      ]}
      api={paymentsApi.getAll}
      defaultParams={{ status: activeTab }}
      columns={columns}
      headerChildren={headerChildren}
      searchPlaceholder="Search by student, ref, or type..."
      emptyTitle={emptyConfig.title}
      emptyDescription={emptyConfig.desc}
    />
  );
};

export default PendingPayments;
