const financeService = require('../services/finance');
const { sendSuccess } = require('../utils/response');

const financeController = {
  listCategories: async (req, res) => {
    const categories = await financeService.listCategories(req.collegeId, req.query.type);
    return sendSuccess(res, 200, 'Finance categories retrieved successfully', categories);
  },

  createCategory: async (req, res) => {
    const category = await financeService.createCategory(req.collegeId, req.body);
    return sendSuccess(res, 201, 'Finance category created successfully', category);
  },

  addTransaction: async (req, res) => {
    const transaction = await financeService.addManualTransaction(req.collegeId, req.body);
    return sendSuccess(res, 201, 'Ledger transaction recorded successfully', transaction);
  },

  listTransactions: async (req, res) => {
    const result = await financeService.listTransactions(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Ledger transactions retrieved successfully', result.data, result.meta);
  },

  getSummary: async (req, res) => {
    const summary = await financeService.getFinanceSummary(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Finance summary retrieved successfully', summary);
  }
};

module.exports = financeController;
