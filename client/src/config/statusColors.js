export const STATUS_STYLES = Object.freeze({
  // Membership / Registration / Orders
  active: 'bg-success/15 text-success border-success/30',
  paid: 'bg-success/15 text-success border-success/30',
  confirmed: 'bg-success/15 text-success border-success/30',
  fulfilled: 'bg-success/15 text-success border-success/30',
  completed: 'bg-success/15 text-success border-success/30',
  approved: 'bg-success/15 text-success border-success/30',
  success: 'bg-success/15 text-success border-success/30',

  // Pending / Progress / Warning
  pending: 'bg-warning/15 text-warning border-warning/30',
  reserved: 'bg-warning/15 text-warning border-warning/30',
  in_progress: 'bg-info/15 text-info border-info/30',
  submitted: 'bg-info/15 text-info border-info/30',
  draft: 'bg-muted/15 text-muted border-line',

  // Cancelled / Failed / Danger
  expired: 'bg-danger/15 text-danger border-danger/30',
  cancelled: 'bg-danger/15 text-danger border-danger/30',
  failed: 'bg-danger/15 text-danger border-danger/30',
  rejected: 'bg-danger/15 text-danger border-danger/30',

  // Transaction types
  income: 'bg-success/15 text-success border-success/30',
  expense: 'bg-danger/15 text-danger border-danger/30',

  // Generic fallback
  default: 'bg-canvas-2 text-ink border-line',
});

export const getStatusStyle = (status) => {
  if (!status) return STATUS_STYLES.default;
  const key = String(status).toLowerCase();
  return STATUS_STYLES[key] || STATUS_STYLES.default;
};
