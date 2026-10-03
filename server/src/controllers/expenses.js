const expensesService = require('../services/expenses');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/appError');

const expensesController = {
  submit: async (req, res) => {
    if (!req.file) {
      throw new AppError('Receipt file is required (PDF, JPG, or PNG up to 5MB)', 400);
    }

    const payload = {
      amount: req.body.amount,
      reason: req.body.reason,
      event_id: req.body.event_id,
      fundraiser_id: req.body.fundraiser_id,
      receiptPath: req.file.path
    };

    const expense = await expensesService.submitExpense(req.user.id, req.collegeId, payload);
    return sendSuccess(res, 201, 'Expense reimbursement request submitted successfully', expense);
  },

  listAll: async (req, res) => {
    const result = await expensesService.listAllExpenses(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Expense requests retrieved successfully', result.data, result.meta);
  },

  getStudentExpenses: async (req, res) => {
    const result = await expensesService.getStudentExpenses(req.user.id, req.collegeId, req.query);
    return sendSuccess(res, 200, 'Student expenses retrieved successfully', result.data, result.meta);
  },

  getById: async (req, res) => {
    const expense = await expensesService.getExpenseById(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'Expense request retrieved successfully', expense);
  },

  review: async (req, res) => {
    const reviewed = await expensesService.reviewExpense(
      req.params.id,
      req.collegeId,
      req.user.id,
      req.body
    );
    return sendSuccess(res, 200, `Expense request ${reviewed.status} successfully`, reviewed);
  }
};

module.exports = expensesController;
