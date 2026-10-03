import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, Check, X, FileText, Lock } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Textarea } from '@/components/ui/Textarea';
import { expensesApi } from '@/api/expenses';
import { formatCurrency, formatDateTime } from '@/utils/format';

export const ExpenseReview = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Review Detail Modal
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openReviewModal = (expense) => {
    setSelectedExpense(expense);
    setReviewNote(expense.review_note || '');
  };

  const handleReviewAction = async (status) => {
    if (!reviewNote.trim()) {
      toast.error('A review note is required to finalize approval or rejection.');
      return;
    }

    setIsSubmitting(true);
    try {
      await expensesApi.reviewExpense(selectedExpense.id, {
        status,
        review_note: reviewNote.trim(),
      });
      toast.success(`Claim marked as ${status.toLowerCase()}!`);
      setSelectedExpense(null);
      setReviewNote('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to review expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Claim #',
      render: (row) => <span className="font-mono font-semibold">#{row.id}</span>,
    },
    {
      key: 'submitter_name',
      header: 'Claimant',
      render: (row) => (
        <div>
          <span className="font-bold text-ink">{row.submitter_name || row.student_name || 'Member'}</span>
          <span className="block text-xs text-muted">{row.submitter_email || row.student_email}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className="font-bold text-ink">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: 'reason',
      header: 'Purpose',
      render: (row) => (
        <span className="text-xs text-muted truncate max-w-xs block">
          {row.reason}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge status={row.status || 'PENDING'} />,
    },
    {
      key: 'actions',
      header: 'Review',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openReviewModal(row)}
          icon={Eye}
        >
          Audit
        </Button>
      ),
    },
  ];

  const receiptUrl = selectedExpense?.receipt_url
    ? selectedExpense.receipt_url.startsWith('http')
      ? selectedExpense.receipt_url
      : `http://localhost:5000${selectedExpense.receipt_url}`
    : null;

  const isLocked = selectedExpense && selectedExpense.status !== 'PENDING';

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Expense Claims Audit"
        subtitle="Review uploaded vendor bills, verify receipts, and authorize reimbursements"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Expenses', href: '/admin/expenses' },
        ]}
        api={expensesApi.listExpenses}
        columns={columns}
        searchPlaceholder="Search claims by claimant or purpose..."
      />

      {/* Review Modal */}
      <Modal
        isOpen={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        title={`Audit Claim #${selectedExpense?.id}`}
        maxWidth="max-w-xl"
      >
        {selectedExpense && (
          <div className="space-y-5">
            {/* Overview info */}
            <div className="p-4 bg-canvas rounded-md border border-line space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Claimant:</span>
                <span className="font-bold text-ink">{selectedExpense.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Amount Claimed:</span>
                <span className="font-bold text-primary text-sm">
                  {formatCurrency(selectedExpense.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Reason / Purpose:</span>
                <span className="font-medium text-ink">{selectedExpense.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Submitted Date:</span>
                <span className="text-muted">{formatDateTime(selectedExpense.created_at)}</span>
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Receipt Attachment
              </span>
              <div className="p-3 bg-canvas-2/50 border border-line rounded-md flex flex-col items-center justify-center min-h-[160px] max-h-72 overflow-hidden">
                {receiptUrl ? (
                  receiptUrl.endsWith('.pdf') ? (
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary font-semibold text-xs hover:underline"
                    >
                      <FileText className="h-5 w-5" /> View Uploaded PDF Document
                    </a>
                  ) : (
                    <img
                      src={receiptUrl}
                      alt="Receipt Attachment"
                      className="max-h-64 object-contain rounded"
                    />
                  )
                ) : (
                  <span className="text-xs text-muted">No receipt file attached</span>
                )}
              </div>
            </div>

            {/* Lock or Action */}
            {isLocked ? (
              <div className="p-3 bg-canvas border border-line rounded-md flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted">
                  <Lock className="h-4 w-4 text-muted" />
                  <span>
                    Audited status:{' '}
                    <strong className="text-ink">{selectedExpense.status}</strong>
                  </span>
                </div>
                <span className="text-muted italic">
                  Note: {selectedExpense.review_note || 'No note'}
                </span>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <FormField
                  label="Auditor / Review Note"
                  required
                  hint="Provide reason for approval or rejection (visible to student)"
                >
                  <Textarea
                    rows={2}
                    placeholder="e.g. Approved against verified food bill receipt."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                  />
                </FormField>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-line">
                  <Button
                    variant="outline"
                    className="text-danger border-danger/30 hover:bg-danger/10"
                    onClick={() => handleReviewAction('REJECTED')}
                    isLoading={isSubmitting}
                    icon={X}
                  >
                    Reject Claim
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleReviewAction('APPROVED')}
                    isLoading={isSubmitting}
                    icon={Check}
                  >
                    Approve Reimbursement
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default ExpenseReview;
