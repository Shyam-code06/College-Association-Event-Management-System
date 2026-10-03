const db = require('../config/database');
const expenseModel = require('../models/expense');
const financeModel = require('../models/finance');
const { EXPENSE_STATUS, FINANCE_TYPE, TRANSACTION_SOURCE } = require('../constants/statuses');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const expensesService = {
  /**
   * Submits a new expense reimbursement request (Student).
   *
   * @param {number} studentId
   * @param {number} collegeId
   * @param {object} payload
   */
  submitExpense: async (studentId, collegeId, { amount, reason, event_id, fundraiser_id, receiptPath }) => {
    return expenseModel.create(collegeId, {
      submitter_id: studentId,
      amount: parseFloat(amount),
      reason,
      event_id: event_id ? parseInt(event_id, 10) : null,
      fundraiser_id: fundraiser_id ? parseInt(fundraiser_id, 10) : null,
      receipt_path: receiptPath,
      status: EXPENSE_STATUS.SUBMITTED
    });
  },

  /**
   * Lists expense requests for College Admin.
   */
  listAllExpenses: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const expenses = await expenseModel.findAll(collegeId, {
      status: queryParams.status,
      offset,
      limit
    });
    const total = await expenseModel.count(collegeId, { status: queryParams.status });

    return {
      data: expenses,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Lists student's personal submitted expenses.
   */
  getStudentExpenses: async (studentId, collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const expenses = await expenseModel.findStudentExpenses(studentId, collegeId, { offset, limit });
    const total = await expenseModel.countStudentExpenses(studentId, collegeId);

    return {
      data: expenses,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Retrieves single expense by ID.
   */
  getExpenseById: async (id, collegeId) => {
    const expense = await expenseModel.findById(id, collegeId);
    if (!expense) {
      throw new AppError('Expense request not found', 404);
    }
    return expense;
  },

  /**
   * Reviews (approves or rejects) an expense request (College Admin only).
   * In one transaction: if approved, writes to financial ledger in 'Volunteer Reimbursement'.
   * If rejected, creates no ledger entry.
   * Already-reviewed requests cannot be re-reviewed.
   *
   * @param {number} id
   * @param {number} collegeId
   * @param {number} reviewerId
   * @param {object} payload - { status, review_note }
   */
  reviewExpense: async (id, collegeId, reviewerId, { status, review_note }) => {
    if (![EXPENSE_STATUS.APPROVED, EXPENSE_STATUS.REJECTED].includes(status)) {
      throw new AppError('Review status must be either approved or rejected', 400);
    }

    return db.transaction(async (trx) => {
      const expense = await expenseModel.findById(id, collegeId, trx);
      if (!expense) {
        throw new AppError('Expense request not found', 404);
      }

      if (expense.status !== EXPENSE_STATUS.SUBMITTED) {
        throw new AppError(`This expense request has already been reviewed with status: ${expense.status}`, 400);
      }

      const updatedExpense = await expenseModel.update(
        id,
        collegeId,
        {
          status,
          reviewed_by: reviewerId,
          review_note
        },
        trx
      );

      if (status === EXPENSE_STATUS.APPROVED) {
        // Find or create 'Volunteer Reimbursement' expense category
        let category = await financeModel.findCategoryByName('Volunteer Reimbursement', collegeId, trx);
        if (!category) {
          category = await financeModel.createCategory(
            collegeId,
            { name: 'Volunteer Reimbursement', type: FINANCE_TYPE.EXPENSE },
            trx
          );
        }

        const today = new Date().toISOString().split('T')[0];
        await financeModel.createTransaction(
          collegeId,
          {
            type: FINANCE_TYPE.EXPENSE,
            category_id: category.id,
            amount: expense.amount,
            source_type: TRANSACTION_SOURCE.REIMBURSEMENT,
            source_id: expense.id,
            description: `Reimbursement approved for ${expense.submitter_name}: ${expense.reason}`,
            transaction_date: today
          },
          trx
        );
      }

      return updatedExpense;
    });
  }
};

module.exports = expensesService;
