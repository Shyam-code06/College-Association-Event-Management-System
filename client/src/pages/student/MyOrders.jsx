import React from 'react';
import { ordersApi } from '@/api/orders';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/utils/format';

export const MyOrders = () => {
  const columns = [
    {
      key: 'id',
      header: 'Order #',
      render: (row) => <span className="font-mono font-semibold">#{row.id}</span>,
    },
    {
      key: 'product_name',
      header: 'Item',
      render: (row) => (
        <div>
          <span className="font-semibold text-ink">{row.product_name || 'Merchandise'}</span>
          {row.size && (
            <span className="block text-xs text-muted">Size: {row.size}</span>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      render: (row) => row.quantity || 1,
    },
    {
      key: 'total_amount',
      header: 'Total Price',
      render: (row) => (
        <span className="font-semibold text-primary">
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
      header: 'Order Date',
      render: (row) => formatDateTime(row.created_at),
    },
  ];

  return (
    <ResourceListPage
      title="My Merchandise Orders"
      subtitle="Track your student association apparel and club gear orders"
      breadcrumbs={[
        { label: 'Student Hub', href: '/student/dashboard' },
        { label: 'Orders', href: '/student/orders' },
      ]}
      api={ordersApi.getMyOrders}
      columns={columns}
      searchPlaceholder="Search order records..."
      emptyTitle="No orders placed yet"
      emptyDescription="Visit the merchandise store to browse official club items."
    />
  );
};

export default MyOrders;
