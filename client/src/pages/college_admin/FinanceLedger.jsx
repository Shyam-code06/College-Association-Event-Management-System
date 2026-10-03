import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
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
import { formatCurrency, formatDateTime } from '@/utils/format';

export const FinanceLedger = () => {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const chartData = summary?.by_category
    ? summary.by_category.map((item) => ({
        name: item.category || 'General',
        amount: Number(item.amount || 0),
        color: item.type === 'INCOME' ? '#28A745' : '#DC3545',
      }))
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
      render: (row) => (
        <Badge status={row.type === 'INCOME' ? 'COMPLETED' : 'REJECTED'}>
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span
          className={`font-extrabold ${
            row.type === 'INCOME' ? 'text-success' : 'text-danger'
          }`}
        >
          {row.type === 'INCOME' ? '+' : '-'} {formatCurrency(row.amount)}
        </span>
      ),
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
