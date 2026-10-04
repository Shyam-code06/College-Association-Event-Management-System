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
  const reportPrintRef = useRef(null);
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Manual Entry Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('INCOME');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeChange = (newType) => {
    setType(newType);
    const matching = categories.filter(
      (c) => String(c.type || '').toLowerCase() === String(newType).toLowerCase()
    );
    if (matching.length > 0) {
      setCategoryId(String(matching[0].id));
    } else {
      setCategoryId('');
    }
  };

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
        const matching = catList.filter(
          (c) => String(c.type || '').toLowerCase() === String(type).toLowerCase()
        );
        if (matching.length > 0) {
          setCategoryId(String(matching[0].id));
        } else if (catList.length > 0) {
          setCategoryId(String(catList[0].id));
        }
      }
    });
  }, [refreshKey]);

  const fetchTransactions = async (params) => {
    const res = await financeApi.getTransactions(params);
    const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    setTransactions(items);
    return res;
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    if (!amount || !description) {
      toast.error('Please enter an amount and description.');
      return;
    }

    if (!categoryId) {
      toast.error('Please select a category for this transaction.');
      return;
    }

    setIsSubmitting(true);
    try {
      await financeApi.createManualEntry({
        type: type.toLowerCase(),
        amount: Number(amount),
        category_id: Number(categoryId),
        description: description.trim(),
      });
      toast.success('Transaction entry recorded successfully!');
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
    const toastId = toast.loading('Preparing audited Finance Ledger PDF...');

    try {
      // Ensure we have current transactions list
      let txList = transactions;
      if (!txList || txList.length === 0) {
        const res = await financeApi.getTransactions({ limit: 100 });
        txList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setTransactions(txList);
      }

      // Small delay to ensure any DOM updates / canvas fonts are fully rendered
      await new Promise((r) => setTimeout(r, 250));

      const element = reportPrintRef.current;
      if (!element) {
        throw new Error('Print report template not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const collegeSlug = (user?.college_name || 'GCET').toLowerCase().replace(/\s+/g, '-');
      pdf.save(`Finance-Ledger-${collegeSlug}-${new Date().toISOString().split('T')[0]}.pdf`);
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
      key: 'sr_no',
      header: 'SR. NO.',
      render: (_row, index) => <span className="font-semibold text-muted">{index + 1}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <div>
          <span className="font-bold text-ink">{String(row.description || '').replace(/#(\d+)/g, '$1')}</span>
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
      render: (row) => formatDateTime(row.created_at || row.transaction_date),
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
        api={fetchTransactions}
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
          <div className="space-y-6">
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

      {/* Hidden print container for high-resolution PDF generation */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '800px',
          backgroundColor: '#FFFFFF',
          opacity: 1,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <div
          ref={reportPrintRef}
          style={{
            width: '800px',
            backgroundColor: '#FFFFFF',
            color: '#1F2937',
            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #714B67 0%, #54374D 100%)',
              padding: '24px 32px',
              color: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#E4D5E0',
                    marginBottom: '4px',
                  }}
                >
                  Odoo Student Organization
                </span>
                <h1
                  style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    margin: 0,
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Finance Ledger & Audit Report
                </h1>
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    color: '#F3E8EE',
                    display: 'flex',
                    gap: '16px',
                  }}
                >
                  <span>College Campus: <strong>{user?.college_name || 'GCET'}</strong></span>
                  <span>•</span>
                  <span>Date: <strong>{new Date().toLocaleDateString('en-GB')}</strong></span>
                  <span>•</span>
                  <span>Status: <strong style={{ color: '#6EE7B7' }}>Audited & Balanced</strong></span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '100px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  textAlign: 'right',
                }}
              >
                Official Ledger
              </div>
            </div>
          </div>

          <div style={{ padding: '28px 32px' }}>
            {/* Audited Ledger Summary */}
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '14px',
                letterSpacing: '-0.01em',
              }}
            >
              Audited Ledger Summary
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px',
                marginBottom: '28px',
              }}
            >
              {/* Income */}
              <div
                style={{
                  border: '1px solid #D1FAE5',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Total Income
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', marginBottom: '4px' }}>
                  + {formatCurrency(summary?.total_income || 0)}
                </div>
                <div style={{ fontSize: '11px', color: '#065F46' }}>
                  Memberships, tickets & sales
                </div>
              </div>

              {/* Expense */}
              <div
                style={{
                  border: '1px solid #FEE2E2',
                  backgroundColor: '#FEF2F2',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#B91C1C', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Total Expenses
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626', marginBottom: '4px' }}>
                  - {formatCurrency(summary?.total_expense || 0)}
                </div>
                <div style={{ fontSize: '11px', color: '#991B1B' }}>
                  Reimbursements & costs
                </div>
              </div>

              {/* Net Reserve */}
              <div
                style={{
                  border: '1px solid #E9D5E5',
                  backgroundColor: '#FAF5F9',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#714B67', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Current Net Reserve
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#714B67', marginBottom: '4px' }}>
                  {formatCurrency(summary?.balance || 0)}
                </div>
                <div style={{ fontSize: '11px', color: '#54374D' }}>
                  Audited reserve balance
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {chartData && chartData.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '12px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Category Breakdown
                </h2>
                <div
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    backgroundColor: '#FAFAFA',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {chartData.map((cat, idx) => {
                      const maxVal = Math.max(...chartData.map((c) => c.amount), 1);
                      const pct = Math.min(100, Math.round((cat.amount / maxVal) * 100));
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                            <span style={{ color: '#374151' }}>{cat.name}</span>
                            <span style={{ color: cat.color, fontWeight: 700 }}>{formatCurrency(cat.amount)}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                backgroundColor: cat.color || '#10B981',
                                borderRadius: '4px',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Recorded Journal Entries */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#111827',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Recorded Journal Entries ({transactions.length})
                </h2>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>
                  Sequential Ledger Records (No Internal IDs)
                </span>
              </div>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  fontSize: '12px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#4B5563', width: '70px' }}>SR. NO.</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#4B5563' }}>DESCRIPTION / CATEGORY</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#4B5563', width: '90px' }}>FLOW TYPE</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#4B5563', width: '120px', textAlign: 'right' }}>AMOUNT</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#4B5563', width: '150px' }}>DATE RECORDED</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, idx) => {
                      const isIncome = String(tx.type).toUpperCase() === 'INCOME';
                      return (
                        <tr
                          key={tx.id || idx}
                          style={{
                            borderBottom: '1px solid #F3F4F6',
                            backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#6B7280' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 700, color: '#111827' }}>
                              {String(tx.description || '').replace(/#(\d+)/g, '$1')}
                            </div>
                            {tx.category_name && (
                              <div style={{ fontSize: '11px', color: '#6B7280' }}>{tx.category_name}</div>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                backgroundColor: isIncome ? '#DEF7EC' : '#FDE8E8',
                                color: isIncome ? '#03543F' : '#9B1C1C',
                                border: `1px solid ${isIncome ? '#BCF0DA' : '#FBD5D5'}`,
                              }}
                            >
                              {isIncome ? 'Income' : 'Expense'}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontWeight: 800,
                              fontSize: '13px',
                              color: isIncome ? '#059669' : '#DC2626',
                            }}
                          >
                            {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#4B5563', fontSize: '11px' }}>
                            {formatDateTime(tx.created_at || tx.transaction_date)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: '32px',
                paddingTop: '16px',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#9CA3AF',
              }}
            >
              <span>Generated by Odoo Student Organization ERP System</span>
              <span>Audited Campus Ledger • Confidential Record</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Manual Entry"
      >
        <form onSubmit={handleManualEntry} className="space-y-4">
          <FormField label="Entry Type" required>
            <Select value={type} onChange={(e) => handleTypeChange(e.target.value)}>
              <option value="INCOME">Income / Deposit</option>
              <option value="EXPENSE">Expense / Disbursement</option>
            </Select>
          </FormField>

          <FormField label="Amount (INR ₹)" required>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 2500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Category" required>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories
                .filter((c) => String(c.type || '').toLowerCase() === String(type).toLowerCase())
                .map((c) => (
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
              minLength={3}
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
