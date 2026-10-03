const paymentModel = require('../models/payment');
const { processMockPayment } = require('./mockPayment');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const AppError = require('../utils/appError');

const paymentsService = {
  /**
   * Processes a payment transaction via the mock gateway.
   *
   * @param {number} collegeId
   * @param {number} paymentId
   * @param {boolean} shouldSucceed
   */
  processPayment: async (collegeId, paymentId, shouldSucceed = true) => {
    return processMockPayment(collegeId, paymentId, shouldSucceed);
  },

  /**
   * Retrieves pending payments for College Admin.
   *
   * @param {number} collegeId
   * @param {object} queryParams
   */
  getPendingPayments: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const payments = await paymentModel.findPendingPayments(collegeId, { offset, limit });
    const total = await paymentModel.countPendingPayments(collegeId);

    const formatted = payments.map((p) => ({
      id: p.id,
      collegeId: p.college_id,
      studentName: p.student_name,
      studentEmail: p.student_email,
      reason: `${p.payable_type.toUpperCase()} #${p.payable_id}`,
      amount: parseFloat(p.amount),
      status: p.status,
      transactionRef: p.transaction_ref,
      createdAt: p.created_at
    }));

    return {
      data: formatted,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Retrieves a student's own payment history.
   *
   * @param {number} userId
   * @param {number} collegeId
   * @param {object} queryParams
   */
  getStudentPayments: async (userId, collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const payments = await paymentModel.findStudentPayments(userId, collegeId, { offset, limit });
    const total = await paymentModel.countStudentPayments(userId, collegeId);

    return {
      data: payments,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Gets details for a single payment.
   */
  getPaymentById: async (id, collegeId) => {
    const payment = await paymentModel.findById(id, collegeId);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }
    return payment;
  }
};

module.exports = paymentsService;
