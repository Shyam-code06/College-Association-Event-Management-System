import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, TrendingUp, TrendingDown, Wallet, Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { financeApi } from '@/api/finance';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency, formatDateTime } from '@/utils/format';

export const FinanceLedger = () => {
  const { user } = useAuthStore();
  const printAreaRef = useRef(null);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Manual Entry Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('INCOME');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      financeApi.getSummary(),
      financeApi.getCategories(),
    ]).then(([sumRes, catRes]) => {
      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value?.data || {});
      }
      if (catRes.status === 'fulfilled') {
        const catList = catRes.value?.data || [];
        setCategories(catList);
        if (catList.length > 0 && !categoryId) {
          setCategoryId(String(catList[0].id));
        }
      }
    });
  }, [refreshKey]);

  const handleManualEntry = async (e) => {
    e.preventDefault();
    if (!amount || !description) {
      toast.error('Please enter an amount and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await financeApi.createManualEntry({
        type,
        amount: Number(amount),
        category_id: categoryId ? Number(categoryId) : undefined,
        description,
      });
      toast.success('Transaction entry recorded!');
      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to record entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Generating Finance Ledger PDF report...');

    try {
      const txRes = await financeApi.getTransactions({ limit: 100 });
      const txList = txRes.data || [];

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Brand Header
      pdf.setFillColor(113, 75, 103); // #714B67 primary purple
      pdf.rect(0, 0, pageWidth, 28, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Odoo Student Organization - Finance Ledger', 14, 14);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `College Campus: ${user?.collegeName || 'Gcet'} | Date: ${new Date().toLocaleDateString('en-GB')}`,
        14,
        22
      );

      // Financial Summary Box
      pdf.setTextColor(33, 37, 41);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Audited Ledger Summary', 14, 38);

      const incomeVal = summary?.total_income || 0;
      const expenseVal = summary?.total_expense || 0;
      const balanceVal = summary?.balance || 0;

      pdf.setDrawColor(222, 226, 230);
      pdf.setFillColor(248, 249, 250);
      pdf.roundedRect(14, 42, pageWidth - 28, 22, 3, 3, 'FD');

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(108, 117, 125);
      pdf.text('TOTAL INCOME', 20, 49);
      pdf.text('TOTAL EXPENSES', 80, 49);
      pdf.text('CURRENT NET RESERVE', 140, 49);

      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 185, 129); // green
      pdf.text(`+ ₹${Number(incomeVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, 58);

      pdf.setTextColor(239, 68, 68); // red
      pdf.text(`- ₹${Number(expenseVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 80, 58);

      pdf.setTextColor(113, 75, 103); // purple
      pdf.text(`₹${Number(balanceVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 140, 58);

      let currentY = 74;

      // Capture Chart if available
      if (printAreaRef.current) {
        try {
          const chartElement = printAreaRef.current.querySelector('.recharts-responsive-container');
          if (chartElement) {
            const canvas = await html2canvas(chartElement, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#FFFFFF',
            });
            const imgData = canvas.toDataURL('image/png');
            pdf.setFontSize(12);
            pdf.setTextColor(33, 37, 41);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Category Breakdown Chart', 14, currentY);
            currentY += 4;
            pdf.addImage(imgData, 'PNG', 14, currentY, 182, 50);
            currentY += 56;
          }
        } catch (chartErr) {
          console.warn('Could not render chart in PDF', chartErr);
        }
      }

      // Transactions Ledger Table
      pdf.setFontSize(12);
      pdf.setTextColor(33, 37, 41);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Recorded Journal Entries (${txList.length})`, 14, currentY);
      currentY += 6;

      // Table Header
      pdf.setFillColor(241, 243, 245);
      pdf.rect(14, currentY, pageWidth - 28, 8, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(73, 80, 87);
      pdf.text('ID', 17, currentY + 5);
      pdf.text('DESCRIPTION / CATEGORY', 30, currentY + 5);
      pdf.text('FLOW TYPE', 105, currentY + 5);
      pdf.text('AMOUNT', 135, currentY + 5);
      pdf.text('DATE RECORDED', 165, currentY + 5);
      currentY += 8;

      // Table Rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      for (let i = 0; i < txList.length; i++) {
        const row = txList[i];
        if (currentY > 275) {
          pdf.addPage();
          currentY = 20;
          // Re-draw table header on new page
          pdf.setFillColor(241, 243, 245);
          pdf.rect(14, currentY, pageWidth - 28, 8, 'F');
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(73, 80, 87);
          pdf.text('ID', 17, currentY + 5);
          pdf.text('DESCRIPTION / CATEGORY', 30, currentY + 5);
          pdf.text('FLOW TYPE', 105, currentY + 5);
          pdf.text('AMOUNT', 135, currentY + 5);
          pdf.text('DATE RECORDED', 165, currentY + 5);
          currentY += 8;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
        }

        const isInc = String(row.type).toUpperCase() === 'INCOME';
        const amtStr = `${isInc ? '+' : '-'} ₹${Number(row.amount || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`;

        // Alternating row background
        if (i % 2 === 1) {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(14, currentY, pageWidth - 28, 8, 'F');
        }

        pdf.setTextColor(33, 37, 41);
        pdf.text(`#${row.id}`, 17, currentY + 5);

        // Truncate long descriptions
        const desc = row.description
          ? row.description.length > 38
            ? row.description.substring(0, 36) + '...'
            : row.description
          : '-';
        pdf.text(desc, 30, currentY + 5);

        // Flow type
        if (isInc) {
          pdf.setTextColor(16, 185, 129);
          pdf.text('Income', 105, currentY + 5);
        } else {
          pdf.setTextColor(239, 68, 68);
          pdf.text('Expense', 105, currentY + 5);
        }

        // Amount
        if (isInc) {
          pdf.setTextColor(16, 185, 129);
        } else {
          pdf.setTextColor(239, 68, 68);
        }
        pdf.text(amtStr, 135, currentY + 5);

        // Date
        pdf.setTextColor(108, 117, 125);
        const dateStr = row.created_at ? formatDateTime(row.created_at) : '-';
        pdf.text(dateStr, 165, currentY + 5);

        currentY += 8;
      }

      pdf.save(`Odoo-Finance-Ledger-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Finance Ledger PDF downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const chartData = summary?.by_category
    ? summary.by_category.map((item) => {
        const isIncome = String(item.type).toUpperCase() === 'INCOME';
        return {
          name: item.category || 'General',
          amount: Number(item.amount || 0),
          color: isIncome ? '#10B981' : '#EF4444',
        };
      })
    : [];

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (row) => <span className="font-mono font-semibold">#{row.id}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <div>
          <span className="font-bold text-ink">{row.description}</span>
          {row.category_name && (
            <span className="block text-xs text-muted">{row.category_name}</span>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Flow Type',
      render: (row) => {
        const isIncome = String(row.type).toUpperCase() === 'INCOME';
        return (
          <Badge status={isIncome ? 'COMPLETED' : 'REJECTED'}>
            {isIncome ? 'Income' : 'Expense'}
          </Badge>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => {
        const isIncome = String(row.type).toUpperCase() === 'INCOME';
        return (
          <span
            className={`font-extrabold ${
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isIncome ? '+' : '-'} {formatCurrency(row.amount)}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Date Recorded',
      render: (row) => formatDateTime(row.created_at),
    },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Finance Ledger"
        subtitle="Double-entry auditing, live balances, and expense reconciliations"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Finance', href: '/admin/finance' },
        ]}
        api={financeApi.getTransactions}
        columns={columns}
        actionLabel="Manual Journal Entry"
        onAction={() => setIsModalOpen(true)}
        actionIcon={Plus}
        actions={
          <Button
            variant="outline"
            size="md"
            onClick={handleDownloadPdf}
            isLoading={isExporting}
            icon={Download}
          >
            Download PDF
          </Button>
        }
        searchPlaceholder="Search transactions..."
        headerChildren={
          <div ref={printAreaRef} className="space-y-6">
            {/* StatCards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard
                title="Total Income"
                value={formatCurrency(summary?.total_income || 0)}
                subtitle="Memberships, tickets & sales"
                icon={TrendingUp}
                indicator="success"
              />
              <StatCard
                title="Total Expenses"
                value={formatCurrency(summary?.total_expense || 0)}
                subtitle="Approved reimbursements"
                icon={TrendingDown}
                indicator="danger"
              />
              <StatCard
                title="Current Net Balance"
                value={formatCurrency(summary?.balance || 0)}
                subtitle="Audited reserve fund"
                icon={Wallet}
                indicator="primary"
              />
            </div>

            {/* Recharts Breakdown */}
            {chartData.length > 0 && (
              <Card className="p-6 bg-surface border border-line rounded-lg shadow-soft">
                <h3 className="font-bold text-sm text-ink mb-4">
                  Ledger Breakdown by Category
                </h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#6C757D" fontSize={11} />
                      <YAxis stroke="#6C757D" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #DEE2E6',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        }
      />

      {/* Manual Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Manual Entry"
      >
        <form onSubmit={handleManualEntry} className="space-y-4">
          <FormField label="Entry Type" required>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="INCOME">Income / Deposit</option>
              <option value="EXPENSE">Expense / Disbursement</option>
            </Select>
          </FormField>

          <FormField label="Amount (INR ₹)" required>
            <Input
              type="number"
              placeholder="e.g. 2500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Category">
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Description / Memo" required>
            <Input
              placeholder="e.g. Donation from alumni association"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Record Entry
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default FinanceLedger;
