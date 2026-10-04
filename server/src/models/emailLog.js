const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');

const emailLogModel = {
  create: async (collegeId, logData, trx = db) => {
    const rawStatus = (logData.status || 'sent').toString().toLowerCase();
    const status = rawStatus === 'failed' ? 'failed' : 'sent';
    const insertPayload = {
      college_id: collegeId,
      recipient: logData.recipient,
      subject: logData.subject,
      status,
      error: logData.error || null
    };
    const [id] = await trx('email_logs').insert(insertPayload);
    return trx('email_logs').where({ id, college_id: collegeId }).first();
  },

  createBatch: async (collegeId, logs, trx = db) => {
    if (!logs || logs.length === 0) return [];
    const logsWithCollege = logs.map((log) => {
      const rawStatus = (log.status || 'sent').toString().toLowerCase();
      const status = rawStatus === 'failed' ? 'failed' : 'sent';
      return {
        college_id: collegeId,
        recipient: log.recipient,
        subject: log.subject,
        status,
        error: log.error || null
      };
    });
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
