const db = require('../config/database');
const { ROLES } = require('../constants/roles');
const { applyTenantScope } = require('../utils/tenantScope');

const userModel = {
  create: async (userData, trx = db) => {
    const [id] = await trx('users').insert(userData);
    return trx('users').where({ id }).first();
  },

  findById: async (id, collegeId = null, trx = db) => {
    let query = trx('users').where('users.id', id);
    if (collegeId !== null) {
      query = applyTenantScope(query, collegeId, 'users');
    }
    return query.first();
  },

  findByEmail: async (email, trx = db) => {
    return trx('users')
      .where({ email })
      .first();
  },

  findAllCollegeAdmins: async ({ search, isActive, offset = 0, limit = 10 }, trx = db) => {
    let query = trx('users')
      .select(
        'users.id',
        'users.name',
        'users.email',
        'users.role',
        'users.is_active',
        'users.created_at',
        'users.deleted_at',
        'colleges.id as college_id',
        'colleges.name as college_name',
        'colleges.code as college_code',
        'colleges.is_active as college_is_active'
      )
      .leftJoin('colleges', 'users.college_id', 'colleges.id')
      .where('users.role', ROLES.COLLEGE_ADMIN);

    if (isActive !== undefined) {
      query = query.where('users.is_active', isActive);
    }

    if (search) {
      query = query.where((q) => {
        q.where('users.name', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`)
          .orWhere('colleges.name', 'like', `%${search}%`);
      });
    }

    return query.orderBy('users.created_at', 'desc').offset(offset).limit(limit);
  },

  countCollegeAdmins: async ({ search, isActive }, trx = db) => {
    let query = trx('users')
      .leftJoin('colleges', 'users.college_id', 'colleges.id')
      .where('users.role', ROLES.COLLEGE_ADMIN);

    if (isActive !== undefined) {
      query = query.where('users.is_active', isActive);
    }

    if (search) {
      query = query.where((q) => {
        q.where('users.name', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`)
          .orWhere('colleges.name', 'like', `%${search}%`);
      });
    }

    const result = await query.count('users.id as count').first();
    return parseInt(result.count, 10);
  },

  findAllOrganizers: async (collegeId, { search, isActive, offset = 0, limit = 10 }, trx = db) => {
    let query = trx('users')
      .select('id', 'college_id', 'name', 'email', 'role', 'is_active', 'created_at', 'deleted_at')
      .where('role', ROLES.ORGANIZER);

    query = applyTenantScope(query, collegeId, 'users');

    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
    }

    if (search) {
      query = query.where((q) => {
        q.where('name', 'like', `%${search}%`).orWhere('email', 'like', `%${search}%`);
      });
    }

    return query.orderBy('created_at', 'desc').offset(offset).limit(limit);
  },

  countOrganizers: async (collegeId, { search, isActive }, trx = db) => {
    let query = trx('users')
      .where('role', ROLES.ORGANIZER);

    query = applyTenantScope(query, collegeId, 'users');

    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
    }

    if (search) {
      query = query.where((q) => {
        q.where('name', 'like', `%${search}%`).orWhere('email', 'like', `%${search}%`);
      });
    }

    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  findCollegeUsers: async (collegeId, { role, search, offset = 0, limit = 10 }, trx = db) => {
    let query = trx('users')
      .select('id', 'college_id', 'name', 'email', 'role', 'is_active', 'created_at')
      .whereNull('deleted_at');

    query = applyTenantScope(query, collegeId, 'users');

    if (role) {
      query = query.where('role', role);
    }

    if (search) {
      query = query.where((q) => {
        q.where('name', 'like', `%${search}%`).orWhere('email', 'like', `%${search}%`);
      });
    }

    return query.orderBy('created_at', 'desc').offset(offset).limit(limit);
  },

  countCollegeUsers: async (collegeId, { role, search }, trx = db) => {
    let query = trx('users').whereNull('deleted_at');
    query = applyTenantScope(query, collegeId, 'users');

    if (role) {
      query = query.where('role', role);
    }

    if (search) {
      query = query.where((q) => {
        q.where('name', 'like', `%${search}%`).orWhere('email', 'like', `%${search}%`);
      });
    }

    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  findActiveStudentsByCollege: async (collegeId, trx = db) => {
    let query = trx('users')
      .select('id', 'name', 'email')
      .where('role', ROLES.STUDENT)
      .where('is_active', true)
      .whereNull('deleted_at');

    query = applyTenantScope(query, collegeId, 'users');
    return query;
  },

  update: async (id, data, collegeId = null, trx = db) => {
    let query = trx('users').where('id', id);
    if (collegeId !== null) {
      query = applyTenantScope(query, collegeId);
    }
    await query.update(data);

    let selectQuery = trx('users').where('id', id);
    if (collegeId !== null) {
      selectQuery = applyTenantScope(selectQuery, collegeId);
    }
    return selectQuery.first();
  },

  softDelete: async (id, collegeId = null, trx = db) => {
    let query = trx('users').where('id', id);
    if (collegeId !== null) {
      query = applyTenantScope(query, collegeId);
    }
    await query.update({
      is_active: false,
      deleted_at: trx.fn.now()
    });

    let selectQuery = trx('users').where('id', id);
    if (collegeId !== null) {
      selectQuery = applyTenantScope(selectQuery, collegeId);
    }
    return selectQuery.first();
  }
};

module.exports = userModel;
