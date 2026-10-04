const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');
const { PAYMENT_STATUS } = require('../constants/statuses');

const paymentModel = {
  create: async (collegeId, paymentData, trx = db) => {
    const [id] = await trx('payments').insert({
      college_id: collegeId,
      ...paymentData
    });
    return trx('payments').where({ id, college_id: collegeId }).first();
  },

  findById: async (id, collegeId, trx = db) => {
    let query = trx('payments')
      .select('payments.*', 'users.name as user_name', 'users.email as user_email')
      .leftJoin('users', 'payments.user_id', 'users.id')
      .where('payments.id', id);

    query = applyTenantScope(query, collegeId, 'payments');
    return query.first();
  },

  findByPayable: async (payableType, payableId, collegeId, trx = db) => {
    let query = trx('payments').where({
      payable_type: payableType,
      payable_id: payableId
    });

    query = applyTenantScope(query, collegeId);
    return query.orderBy('created_at', 'desc').first();
  },

  findByRef: async (transactionRef, collegeId, trx = db) => {
    let query = trx('payments').where({ transaction_ref: transactionRef });
    query = applyTenantScope(query, collegeId);
    return query.first();
  },

  update: async (id, collegeId, updateData, trx = db) => {
    let query = trx('payments').where('id', id);
    query = applyTenantScope(query, collegeId);
    await query.update(updateData);
    return trx('payments').where({ id, college_id: collegeId }).first();
  },

  findPendingPayments: async (collegeId, { offset = 0, limit = 10 }, trx = db) => {
    let query = trx('payments')
      .select(
        'payments.id',
        'payments.college_id',
        'payments.user_id',
        'payments.payable_type',
        'payments.payable_id',
        'payments.amount',
        'payments.status',
        'payments.transaction_ref',
        'payments.created_at',
        'users.name as student_name',
        'users.email as student_email'
      )
      .join('users', 'payments.user_id', 'users.id')
      .where('payments.status', PAYMENT_STATUS.PENDING);

    query = applyTenantScope(query, collegeId, 'payments');
    return query.orderBy('payments.created_at', 'desc').offset(offset).limit(limit);
  },

  countPendingPayments: async (collegeId, trx = db) => {
    let query = trx('payments').where('status', PAYMENT_STATUS.PENDING);
    query = applyTenantScope(query, collegeId);
    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  findStudentPayments: async (userId, collegeId, { offset = 0, limit = 10 }, trx = db) => {
    let query = trx('payments')
      .where('user_id', userId);

    query = applyTenantScope(query, collegeId);
    return query.orderBy('created_at', 'desc').offset(offset).limit(limit);
  },

  countStudentPayments: async (userId, collegeId, trx = db) => {
    let query = trx('payments').where('user_id', userId);
    query = applyTenantScope(query, collegeId);
    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  findAllPayments: async (collegeId, { status, search, offset = 0, limit = 10 }, trx = db) => {
    let query = trx('payments')
      .select(
        'payments.*',
        'users.name as student_name',
        'users.email as student_email'
      )
      .join('users', 'payments.user_id', 'users.id');

    query = applyTenantScope(query, collegeId, 'payments');

    if (status && status !== 'all') {
      if (status === 'approved' || status === 'success') {
        query = query.whereIn('payments.status', [PAYMENT_STATUS.SUCCESS, 'approved']);
      } else if (status === 'pending') {
        query = query.where('payments.status', PAYMENT_STATUS.PENDING);
      } else {
        query = query.where('payments.status', status);
      }
    }

    if (search) {
      query = query.where((q) => {
        q.where('users.name', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`)
          .orWhere('payments.transaction_ref', 'like', `%${search}%`)
          .orWhere('payments.payable_type', 'like', `%${search}%`);
      });
    }

    return query.orderBy('payments.created_at', 'desc').offset(offset).limit(limit);
  },

  countAllPayments: async (collegeId, { status, search }, trx = db) => {
    let query = trx('payments')
      .join('users', 'payments.user_id', 'users.id');
    query = applyTenantScope(query, collegeId, 'payments');

    if (status && status !== 'all') {
      if (status === 'approved' || status === 'success') {
        query = query.whereIn('payments.status', [PAYMENT_STATUS.SUCCESS, 'approved']);
      } else if (status === 'pending') {
        query = query.where('payments.status', PAYMENT_STATUS.PENDING);
      } else {
        query = query.where('payments.status', status);
      }
    }

    if (search) {
      query = query.where((q) => {
        q.where('users.name', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`)
          .orWhere('payments.transaction_ref', 'like', `%${search}%`)
          .orWhere('payments.payable_type', 'like', `%${search}%`);
      });
    }

    const result = await query.count('payments.id as count').first();
    return parseInt(result?.count || 0, 10);
  }
};

module.exports = paymentModel;
