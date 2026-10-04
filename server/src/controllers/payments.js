const paymentsService = require('../services/payments');
const { sendSuccess } = require('../utils/response');

const paymentsController = {
  processPayment: async (req, res) => {
    const shouldSucceed = req.body.shouldSucceed !== undefined ? Boolean(req.body.shouldSucceed) : true;
    const result = await paymentsService.processPayment(
      req.collegeId,
      req.params.id,
      shouldSucceed
    );
    return sendSuccess(res, 200, 'Payment processed successfully', result);
  },

  getAllPayments: async (req, res) => {
    const result = await paymentsService.getAllPayments(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Payments retrieved successfully', result.data, result.meta);
  },

  getPendingPayments: async (req, res) => {
    const result = await paymentsService.getPendingPayments(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Pending payments retrieved successfully', result.data, result.meta);
  },

  getStudentPayments: async (req, res) => {
    const result = await paymentsService.getStudentPayments(req.user.id, req.collegeId, req.query);
    return sendSuccess(res, 200, 'Student payments retrieved successfully', result.data, result.meta);
  },

  getById: async (req, res) => {
    const payment = await paymentsService.getPaymentById(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'Payment retrieved successfully', payment);
  }
};

module.exports = paymentsController;
