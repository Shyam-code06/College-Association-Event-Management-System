import React from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { ordersApi } from '@/api/orders';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { useAuthStore } from '@/stores/auth';

export const MyOrders = () => {
  const user = useAuthStore((state) => state.user);

  const handleDownloadPdf = (order) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const collegeTitle = user?.college_name || user?.college?.name || 'Student Organization';

      // Header Bar
      doc.setFillColor(113, 75, 103);
      doc.rect(0, 0, pageWidth, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(collegeTitle, 14, 11);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL MERCHANDISE ORDER INVOICE', 14, 18);

      // Status Pill
      const orderStatus = (order.status || 'PAID').toUpperCase();
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(pageWidth - 36, 8, 24, 8, 2, 2, 'F');
      doc.setTextColor(5, 150, 105);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(orderStatus, pageWidth - 32, 13.5);

      // Order Reference & Date
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Order #${order.order_number ?? order.id}`, 14, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const dateText = order.created_at ? formatDateTime(order.created_at) : 'N/A';
      doc.text(`Order Date: ${dateText}`, 14, 42);

      // Student Card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 48, pageWidth - 28, 24, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 48, pageWidth - 28, 24, 2, 2, 'S');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('STUDENT INFORMATION', 18, 54);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(order.student_name || user?.name || 'Student', 18, 61);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(order.student_email || user?.email || '', 18, 67);

      // Table Header
      let y = 80;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('ITEM', 18, y + 5.5);
      doc.text('SIZE', pageWidth - 58, y + 5.5);
      doc.text('QTY', pageWidth - 42, y + 5.5);
      doc.text('TOTAL', pageWidth - 18, y + 5.5, { align: 'right' });

      // Table Items
      y += 13;
      const items =
        order.items && order.items.length > 0
          ? order.items
          : [
              {
                product_name: order.product_name || 'Merchandise Item',
                variant_size: order.size,
                quantity: order.quantity || 1,
                total_price: order.total_amount,
              },
            ];

      items.forEach((item) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(item.product_name || 'Merchandise Item', 18, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(item.variant_size || item.size || '—', pageWidth - 58, y);
        doc.text(String(item.quantity || 1), pageWidth - 40, y);

        const itemTotal = Number(item.total_price || item.unit_price || order.total_amount || 0).toFixed(2);
        doc.setTextColor(15, 23, 42);
        doc.text(`Rs. ${itemTotal}`, pageWidth - 18, y, { align: 'right' });

        y += 10;
      });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, pageWidth - 14, y);
      y += 7;

      // Summary
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('TOTAL PAID:', pageWidth - 60, y);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(113, 75, 103);
      doc.text(`Rs. ${Number(order.total_amount || 0).toFixed(2)}`, pageWidth - 18, y, { align: 'right' });

      // Pickup Instructions Box
      y += 14;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'S');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(113, 75, 103);
      doc.text('PICKUP & VERIFICATION INSTRUCTIONS', 18, y + 6);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Present this receipt to collect your gear at the pickup desk.', 18, y + 11);
      doc.text(`Generated on ${new Date().toLocaleString()}.`, 18, y + 16);

      const fileName = `Order-Receipt-#${order.order_number ?? order.id}.pdf`;
      doc.save(fileName);
      toast.success('Order receipt PDF downloaded!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF receipt.');
    }
  };

  const columns = [
    {
      key: 'order_number',
      header: 'Order No.',
      render: (row, index) => (
        <span className="font-mono font-semibold">
          {row.order_number ?? ((index ?? 0) + 1)}
        </span>
      ),
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
    {
      key: 'actions',
      header: 'Receipt',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownloadPdf(row)}
          icon={Download}
          className="text-xs font-semibold gap-1.5 whitespace-nowrap text-primary hover:bg-primary/5 hover:border-primary/40"
        >
          Download PDF
        </Button>
      ),
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
