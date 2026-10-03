const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');
const { FINANCE_TYPE } = require('../constants/statuses');

const financeModel = {
  // --- Finance Categories ---
  findCategoryById: async (id, collegeId, trx = db) => {
    let query = trx('finance_categories').where('id', id);
    query = applyTenantScope(query, collegeId);
    return query.first();
  },

  findCategoryByName: async (name, collegeId, trx = db) => {
    let query = trx('finance_categories').where('name', name);
    query = applyTenantScope(query, collegeId);
    return query.first();
  },

  findAllCategories: async (collegeId, type = null, trx = db) => {
    let query = trx('finance_categories');
    query = applyTenantScope(query, collegeId);

    if (type) {
      query = query.where('type', type);
    }

    return query.orderBy('name', 'asc');
  },

  createCategory: async (collegeId, data, trx = db) => {
    const existing = await trx('finance_categories')
      .where({ college_id: collegeId, name: data.name })
      .first();
    if (existing) return existing;

    const [id] = await trx('finance_categories').insert({
      college_id: collegeId,
      ...data
    });
    return trx('finance_categories').where({ id, college_id: collegeId }).first();
  },

  // --- Financial Transactions (Ledger) ---
  createTransaction: async (collegeId, transactionData, trx = db) => {
    const [id] = await trx('financial_transactions').insert({
      college_id: collegeId,
      ...transactionData
    });
    return trx('financial_transactions').where({ id, college_id: collegeId }).first();
  },

  findAllTransactions: async (collegeId, { type, categoryId, startDate, endDate, offset = 0, limit = 20 }, trx = db) => {
    let query = trx('financial_transactions')
      .select(
        'financial_transactions.*',
        'finance_categories.name as category_name'
      )
      .join('finance_categories', 'financial_transactions.category_id', 'finance_categories.id');

    query = applyTenantScope(query, collegeId, 'financial_transactions');

    if (type) {
      query = query.where('financial_transactions.type', type);
    }

    if (categoryId) {
      query = query.where('financial_transactions.category_id', categoryId);
    }

    if (startDate) {
      query = query.where('financial_transactions.transaction_date', '>=', startDate);
    }

    if (endDate) {
      query = query.where('financial_transactions.transaction_date', '<=', endDate);
    }

    return query.orderBy('financial_transactions.transaction_date', 'desc')
      .orderBy('financial_transactions.id', 'desc')
      .offset(offset)
      .limit(limit);
  },

  countTransactions: async (collegeId, { type, categoryId, startDate, endDate }, trx = db) => {
    let query = trx('financial_transactions');
    query = applyTenantScope(query, collegeId);

    if (type) {
      query = query.where('type', type);
    }

    if (categoryId) {
      query = query.where('category_id', categoryId);
    }

    if (startDate) {
      query = query.where('transaction_date', '>=', startDate);
    }

    if (endDate) {
      query = query.where('transaction_date', '<=', endDate);
    }

    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  getFinanceSummary: async (collegeId, { startDate, endDate }, trx = db) => {
    let baseQuery = trx('financial_transactions');
    baseQuery = applyTenantScope(baseQuery, collegeId);

    if (startDate) {
      baseQuery = baseQuery.where('transaction_date', '>=', startDate);
    }

    if (endDate) {
      baseQuery = baseQuery.where('transaction_date', '<=', endDate);
    }

    const incomeSum = await baseQuery.clone()
      .where('type', FINANCE_TYPE.INCOME)
      .sum('amount as total')
      .first();

    const expenseSum = await baseQuery.clone()
      .where('type', FINANCE_TYPE.EXPENSE)
      .sum('amount as total')
      .first();

    const totalIncome = parseFloat(incomeSum.total || 0);
    const totalExpenses = parseFloat(expenseSum.total || 0);
    const balance = parseFloat((totalIncome - totalExpenses).toFixed(2));

    // Category breakdown
    let categoryQuery = trx('financial_transactions')
      .select(
        'finance_categories.id as category_id',
        'finance_categories.name as category_name',
        'finance_categories.type',
        trx.raw('SUM(financial_transactions.amount) as total_amount')
      )
      .join('finance_categories', 'financial_transactions.category_id', 'finance_categories.id');

    categoryQuery = applyTenantScope(categoryQuery, collegeId, 'financial_transactions');

    if (startDate) {
      categoryQuery = categoryQuery.where('financial_transactions.transaction_date', '>=', startDate);
    }

    if (endDate) {
      categoryQuery = categoryQuery.where('financial_transactions.transaction_date', '<=', endDate);
    }

    const categoryBreakdown = await categoryQuery
      .groupBy('finance_categories.id', 'finance_categories.name', 'finance_categories.type')
      .orderBy('total_amount', 'desc');

    const formattedBreakdown = categoryBreakdown.map((item) => ({
      categoryId: item.category_id,
      categoryName: item.category_name,
      type: item.type,
      totalAmount: parseFloat(item.total_amount || 0)
    }));

    return {
      totalIncome,
      totalExpenses,
      balance,
      categoryBreakdown: formattedBreakdown
    };
  }
};

module.exports = financeModel;
