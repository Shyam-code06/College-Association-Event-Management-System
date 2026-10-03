const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');

const emailLogModel = {
  create: async (collegeId, logData, trx = db) => {
    const [id] = await trx('email_logs').insert({
      college_id: collegeId,
      ...logData
    });
    return trx('email_logs').where({ id, college_id: collegeId }).first();
  },

  createBatch: async (collegeId, logs, trx = db) => {
    if (!logs || logs.length === 0) return [];
    const logsWithCollege = logs.map((log) => ({
      college_id: collegeId,
      ...log
    }));
    return trx('email_logs').insert(logsWithCollege);
  },

  findAll: async (collegeId, { status, offset = 0, limit = 20 }, trx = db) => {
    let query = trx('email_logs');
    query = applyTenantScope(query, collegeId);

    if (status) {
      query = query.where('status', status);
    }

    return query.orderBy('created_at', 'desc').offset(offset).limit(limit);
  },

  count: async (collegeId, { status }, trx = db) => {
    let query = trx('email_logs');
    query = applyTenantScope(query, collegeId);

    if (status) {
      query = query.where('status', status);
    }

    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  }
};

module.exports = emailLogModel;
