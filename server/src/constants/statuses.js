const MEMBERSHIP_STATUS = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
});

const DUES_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PAID: 'paid'
});

const EVENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

const REGISTRATION_STATUS = Object.freeze({
  RESERVED: 'reserved',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled'
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed'
});

const PAYABLE_TYPE = Object.freeze({
  MEMBERSHIP: 'membership',
  REGISTRATION: 'registration',
  ORDER: 'order'
});

const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  FULFILLED: 'fulfilled'
});

const FUNDRAISER_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

const FUNDRAISER_TASK_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
});

const EXPENSE_STATUS = Object.freeze({
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected'
});

const FINANCE_TYPE = Object.freeze({
  INCOME: 'income',
  EXPENSE: 'expense'
});

const TRANSACTION_SOURCE = Object.freeze({
  PAYMENT: 'payment',
  REIMBURSEMENT: 'reimbursement',
  FUNDRAISER: 'fundraiser',
  MANUAL: 'manual'
});

const CHECKIN_ERROR = Object.freeze({
  INVALID_TICKET: 'INVALID_TICKET',
  WRONG_EVENT: 'WRONG_EVENT',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  ALREADY_USED: 'ALREADY_USED'
});

module.exports = {
  MEMBERSHIP_STATUS,
  DUES_STATUS,
  EVENT_STATUS,
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
  PAYABLE_TYPE,
  ORDER_STATUS,
  FUNDRAISER_STATUS,
  FUNDRAISER_TASK_STATUS,
  EXPENSE_STATUS,
  FINANCE_TYPE,
  TRANSACTION_SOURCE,
  CHECKIN_ERROR
};
