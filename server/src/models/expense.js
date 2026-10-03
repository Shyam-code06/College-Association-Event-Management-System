const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');

const expenseModel = {
  create: async (collegeId, data, trx = db) => {
    const [id] = await trx('expense_requests').insert({
      college_id: collegeId,
      ...data
    });
    return trx('expense_requests').where({ id, college_id: collegeId }).first();
  },

  findById: async (id, collegeId, trx = db) => {
    let query = trx('expense_requests')
      .select(
        'expense_requests.*',
        'submitters.name as submitter_name',
        'submitters.email as submitter_email',
        'reviewers.name as reviewer_name',
        'events.name as event_name',
        'fundraisers.title as fundraiser_title'
      )
      .join('users as submitters', 'expense_requests.submitter_id', 'submitters.id')
      .leftJoin('users as reviewers', 'expense_requests.reviewed_by', 'reviewers.id')
      .leftJoin('events', 'expense_requests.event_id', 'events.id')
      .leftJoin('fundraisers', 'expense_requests.fundraiser_id', 'fundraisers.id')
      .where('expense_requests.id', id);

    query = applyTenantScope(query, collegeId, 'expense_requests');
    return query.first();
  },

  findAll: async (collegeId, { status, offset = 0, limit = 10 }, trx = db) => {
    let query = trx('expense_requests')
      .select(
        'expense_requests.*',
        'submitters.name as submitter_name',
        'submitters.email as submitter_email',
        'reviewers.name as reviewer_name'
      )
      .join('users as submitters', 'expense_requests.submitter_id', 'submitters.id')
      .leftJoin('users as reviewers', 'expense_requests.reviewed_by', 'reviewers.id');

    query = applyTenantScope(query, collegeId, 'expense_requests');

    if (status) {
      query = query.where('expense_requests.status', status);
    }

    return query.orderBy('expense_requests.created_at', 'desc').offset(offset).limit(limit);
  },

  count: async (collegeId, { status }, trx = db) => {
    let query = trx('expense_requests');
    query = applyTenantScope(query, collegeId);

    if (status) {
      query = query.where('status', status);
    }

    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  findStudentExpenses: async (studentId, collegeId, { offset = 0, limit = 10 }, trx = db) => {
    let query = trx('expense_requests')
      .select('expense_requests.*', 'events.name as event_name', 'fundraisers.title as fundraiser_title')
      .leftJoin('events', 'expense_requests.event_id', 'events.id')
      .leftJoin('fundraisers', 'expense_requests.fundraiser_id', 'fundraisers.id')
      .where('expense_requests.submitter_id', studentId);

    query = applyTenantScope(query, collegeId, 'expense_requests');
    return query.orderBy('expense_requests.created_at', 'desc').offset(offset).limit(limit);
  },

  countStudentExpenses: async (studentId, collegeId, trx = db) => {
    let query = trx('expense_requests').where('submitter_id', studentId);
    query = applyTenantScope(query, collegeId);
    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  update: async (id, collegeId, updateData, trx = db) => {
    let query = trx('expense_requests').where('id', id);
    query = applyTenantScope(query, collegeId);
    await query.update(updateData);
    return trx('expense_requests').where({ id, college_id: collegeId }).first();
  }
};

module.exports = expenseModel;
