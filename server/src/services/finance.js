const financeModel = require('../models/finance');
const { TRANSACTION_SOURCE } = require('../constants/statuses');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const financeService = {
  /**
   * Lists categories for the college.
   */
  listCategories: async (collegeId, type) => {
    return financeModel.findAllCategories(collegeId, type);
  },

  /**
   * Creates a custom finance category for the college.
   */
  createCategory: async (collegeId, { name, type }) => {
    const existing = await financeModel.findCategoryByName(name, collegeId);
    if (existing) {
      throw new AppError('A category with this name already exists in this college', 409);
    }
    return financeModel.createCategory(collegeId, { name, type });
  },

  /**
   * Adds a manual transaction entry to the college ledger.
   *
   * @param {number} collegeId
   * @param {object} payload - { type, category_id, amount, description, transaction_date }
   */
  addManualTransaction: async (collegeId, { type, category_id, amount, description, transaction_date }) => {
    const category = await financeModel.findCategoryById(category_id, collegeId);
    if (!category) {
      throw new AppError('Finance category not found', 404);
    }

    if (category.type !== type) {
      throw new AppError(`Category type mismatch: Category '${category.name}' is of type '${category.type}'`, 400);
    }

    const txDate = transaction_date || new Date().toISOString().split('T')[0];

    return financeModel.createTransaction(collegeId, {
      type,
      category_id,
      amount: parseFloat(amount),
      source_type: TRANSACTION_SOURCE.MANUAL,
      source_id: null,
      description,
      transaction_date: txDate
    });
  },

  /**
   * Retrieves ledger transactions with filters.
   */
  listTransactions: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const filters = {
      type: queryParams.type,
      categoryId: queryParams.categoryId ? parseInt(queryParams.categoryId, 10) : undefined,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      offset,
      limit
    };

    const transactions = await financeModel.findAllTransactions(collegeId, filters);
    const total = await financeModel.countTransactions(collegeId, filters);

    return {
      data: transactions,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Computes financial summary (total income, total expenses, balance, category breakdown).
   */
  getFinanceSummary: async (collegeId, queryParams = {}) => {
    return financeModel.getFinanceSummary(collegeId, {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate
    });
  }
};

module.exports = financeService;
