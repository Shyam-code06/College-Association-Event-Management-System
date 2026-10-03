import React from 'react';
import { ordersApi } from '@/api/orders';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/utils/format';

export const AdminOrders = () => {
  const columns = [
    {
      key: 'id',
      header: 'Order #',
      render: (row) => <span className="font-mono font-semibold">#{row.id}</span>,
    },
    {
      key: 'student_name',
      header: 'Student',
      render: (row) => (
        <div>
          <span className="font-bold text-ink">{row.student_name || 'Student'}</span>
          <span className="block text-xs text-muted">{row.student_email}</span>
        </div>
      ),
    },
    {
      key: 'product_name',
      header: 'Item',
      render: (row) => (
        <div>
          <span className="font-semibold text-ink">{row.product_name}</span>
          {row.size && (
            <span className="block text-xs text-muted">Size: {row.size}</span>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => row.quantity,
    },
    {
      key: 'total_amount',
      header: 'Total Price',
      render: (row) => (
        <span className="font-bold text-primary">
          {formatCurrency(row.total_amount)}
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
      header: 'Date',
      render: (row) => formatDateTime(row.created_at),
    },
  ];

  return (
    <ResourceListPage
      title="Merchandise Orders"
      subtitle="Fulfill student merchandise purchases and track pickup status"
      breadcrumbs={[
        { label: 'Apps', href: '/apps' },
        { label: 'Orders', href: '/admin/orders' },
      ]}
      api={ordersApi.getAll}
      columns={columns}
      searchPlaceholder="Search orders..."
    />
  );
};

export default AdminOrders;
