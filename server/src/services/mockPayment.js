const crypto = require('crypto');
const db = require('../config/database');
const paymentModel = require('../models/payment');
const membershipModel = require('../models/membership');
const registrationModel = require('../models/registration');
const orderModel = require('../models/order');
const financeModel = require('../models/finance');
const {
  PAYMENT_STATUS,
  MEMBERSHIP_STATUS,
  DUES_STATUS,
  REGISTRATION_STATUS,
  ORDER_STATUS,
  FINANCE_TYPE,
  TRANSACTION_SOURCE
} = require('../constants/statuses');
const AppError = require('../utils/appError');

/**
 * Generates unique transaction reference.
 */
const generateTransactionRef = () => {
  return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

/**
 * Processes a mock payment transaction.
 *
 * @param {number} collegeId
 * @param {number} paymentId
 * @param {boolean} shouldSucceed - Mock flag to simulate success or failure
 * @returns {Promise<object>} Processed payment
 */
const processMockPayment = async (collegeId, paymentId, shouldSucceed = true) => {
  return db.transaction(async (trx) => {
    const payment = await paymentModel.findById(paymentId, collegeId, trx);
    if (!payment) {
      throw new AppError('Payment record not found', 404);
    }

    if (payment.status !== PAYMENT_STATUS.PENDING) {
      throw new AppError(`Payment is already processed with status: ${payment.status}`, 400);
    }

    const today = new Date().toISOString().split('T')[0];

    if (shouldSucceed) {
      // 1. Update payment to success
      const updatedPayment = await paymentModel.update(
        payment.id,
        collegeId,
        {
          status: PAYMENT_STATUS.SUCCESS,
          paid_at: trx.fn.now()
        },
        trx
      );

      // 2. Process payable-specific lifecycle and ledger
      if (payment.payable_type === 'membership') {
        const membership = await membershipModel.findById(payment.payable_id, collegeId, trx);
        if (membership) {
          const plan = await membershipModel.findPlanById(membership.plan_id, collegeId, trx);
          const durationMonths = plan ? plan.duration_months : 12;

          const startDate = new Date();
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

          await membershipModel.updateMembership(
            membership.id,
            collegeId,
            {
              status: MEMBERSHIP_STATUS.ACTIVE,
              dues_status: DUES_STATUS.PAID,
              start_date: startDate.toISOString().split('T')[0],
              expiry_date: expiryDate.toISOString().split('T')[0]
            },
            trx
          );

          // Ledger Entry
          let category = await financeModel.findCategoryByName('Membership Dues', collegeId, trx);
          if (!category) {
            category = await financeModel.createCategory(
              collegeId,
              { name: 'Membership Dues', type: FINANCE_TYPE.INCOME },
              trx
            );
          }

          await financeModel.createTransaction(
            collegeId,
            {
              type: FINANCE_TYPE.INCOME,
              category_id: category.id,
              amount: payment.amount,
              source_type: TRANSACTION_SOURCE.PAYMENT,
              source_id: payment.id,
              description: `Membership payment for plan: ${plan ? plan.name : 'Standard'}`,
              transaction_date: today
            },
            trx
          );
        }
      } else if (payment.payable_type === 'registration') {
        const registration = await registrationModel.findById(payment.payable_id, collegeId, trx);
        if (registration) {
          await registrationModel.update(
            registration.id,
            collegeId,
            { status: REGISTRATION_STATUS.CONFIRMED },
            trx
          );

          let category = await financeModel.findCategoryByName('Ticket Sales', collegeId, trx);
          if (!category) {
            category = await financeModel.createCategory(
              collegeId,
              { name: 'Ticket Sales', type: FINANCE_TYPE.INCOME },
              trx
            );
          }

          await financeModel.createTransaction(
            collegeId,
            {
              type: FINANCE_TYPE.INCOME,
              category_id: category.id,
              amount: payment.amount,
              source_type: TRANSACTION_SOURCE.PAYMENT,
              source_id: payment.id,
              description: `Ticket purchase for event: ${registration.event_name || 'Event'}`,
              transaction_date: today
            },
            trx
          );
        }
      } else if (payment.payable_type === 'order') {
        const order = await orderModel.findOrderById(payment.payable_id, collegeId, trx);
        if (order) {
          await orderModel.updateOrderStatus(order.id, collegeId, ORDER_STATUS.PAID, trx);

          let category = await financeModel.findCategoryByName('Merchandise Sales', collegeId, trx);
          if (!category) {
            category = await financeModel.createCategory(
              collegeId,
              { name: 'Merchandise Sales', type: FINANCE_TYPE.INCOME },
              trx
            );
          }

          await financeModel.createTransaction(
            collegeId,
            {
              type: FINANCE_TYPE.INCOME,
              category_id: category.id,
              amount: payment.amount,
              source_type: TRANSACTION_SOURCE.PAYMENT,
              source_id: payment.id,
              description: `Merchandise order #${order.id}`,
              transaction_date: today
            },
            trx
          );
        }
      }

      return updatedPayment;
    } else {
      // Payment Failed: release reservation/order
      const failedPayment = await paymentModel.update(
        payment.id,
        collegeId,
        { status: PAYMENT_STATUS.FAILED },
        trx
      );

      if (payment.payable_type === 'registration') {
        await registrationModel.update(
          payment.payable_id,
          collegeId,
          { status: REGISTRATION_STATUS.CANCELLED },
          trx
        );
      } else if (payment.payable_type === 'order') {
        await orderModel.updateOrderStatus(payment.payable_id, collegeId, ORDER_STATUS.CANCELLED, trx);
      }

      return failedPayment;
    }
  });
};

module.exports = {
  generateTransactionRef,
  processMockPayment
};
