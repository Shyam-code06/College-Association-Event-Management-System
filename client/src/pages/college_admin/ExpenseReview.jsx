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
    setIsSubmitting(true);
    try {
      const finalStatus = status.toLowerCase();
      const defaultNote =
        finalStatus === 'approved'
          ? 'Approved by College Administrator'
          : 'Rejected by College Administrator';
      const noteToSend = reviewNote.trim() || defaultNote;

      await expensesApi.reviewExpense(selectedExpense.id, {
        status: finalStatus,
        review_note: noteToSend,
      });
      toast.success(
        `Claim #${selectedExpense.id} ${
          finalStatus === 'approved' ? 'approved and posted to finance ledger!' : 'rejected.'
        }`
      );
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
      header: 'Claim ID',
      render: (row) => <span className="font-mono font-semibold">{row.id}</span>,
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

  const getReceiptUrl = (expense) => {
    if (!expense) return null;
    const rawPath = expense.receipt_url || expense.receipt_path;
    if (!rawPath) return null;
    if (rawPath.startsWith('http')) return rawPath;
    const normalized = rawPath.replace(/\\/g, '/');
    const uploadsIdx = normalized.indexOf('uploads/');
    const relativePath =
      uploadsIdx !== -1
        ? '/' + normalized.substring(uploadsIdx)
        : normalized.startsWith('/')
        ? normalized
        : '/' + normalized;
    return `http://localhost:5000${relativePath}`;
  };

  const receiptUrl = getReceiptUrl(selectedExpense);

  const isLocked =
    selectedExpense &&
    ['approved', 'rejected'].includes(String(selectedExpense.status || '').toLowerCase());

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
                <span className="font-bold text-ink">
                  {selectedExpense.submitter_name || selectedExpense.student_name || 'Member'}
                </span>
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Receipt Attachment
                </span>
                {receiptUrl && (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" /> Open in New Tab
                  </a>
                )}
              </div>
              <div className="p-3 bg-canvas-2/50 border border-line rounded-md flex flex-col items-center justify-center min-h-[160px] max-h-80 overflow-hidden">
                {receiptUrl ? (
                  receiptUrl.toLowerCase().endsWith('.pdf') ? (
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary font-semibold text-xs hover:underline p-3 bg-surface border border-line rounded"
                    >
                      <FileText className="h-5 w-5" /> View Uploaded PDF Document
                    </a>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={receiptUrl}
                        alt="Receipt Attachment"
                        className="max-h-64 object-contain rounded border border-line/60 shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => window.open(receiptUrl, '_blank')}
                        title="Click to view full size"
                      />
                    </div>
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
                    <strong className="text-ink capitalize">{selectedExpense.status}</strong>
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
                  hint="Provide remarks for approval or rejection (visible to submitter)"
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
