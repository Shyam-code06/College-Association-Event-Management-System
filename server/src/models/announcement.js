const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');

const announcementModel = {
  create: async (collegeId, data, trx = db) => {
    const [id] = await trx('announcements').insert({
      college_id: collegeId,
      ...data
    });
    return trx('announcements').where({ id, college_id: collegeId }).first();
  },

  findById: async (id, collegeId, trx = db) => {
    let query = trx('announcements')
      .select('announcements.*', 'users.name as author_name', 'users.role as author_role')
      .leftJoin('users', 'announcements.posted_by', 'users.id')
      .where('announcements.id', id);

    query = applyTenantScope(query, collegeId, 'announcements');
    return query.first();
  },

  findAll: async (collegeId, { offset = 0, limit = 10 }, trx = db) => {
    let query = trx('announcements')
      .select('announcements.*', 'users.name as author_name', 'users.role as author_role')
      .leftJoin('users', 'announcements.posted_by', 'users.id');

    query = applyTenantScope(query, collegeId, 'announcements');
    return query.orderBy('announcements.created_at', 'desc').offset(offset).limit(limit);
  },

  count: async (collegeId, trx = db) => {
    let query = trx('announcements');
    query = applyTenantScope(query, collegeId);
    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  }
};

module.exports = announcementModel;
