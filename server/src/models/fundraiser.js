const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');
const { FUNDRAISER_TASK_STATUS } = require('../constants/statuses');

const fundraiserModel = {
  createFundraiser: async (collegeId, data, trx = db) => {
    const [id] = await trx('fundraisers').insert({
      college_id: collegeId,
      ...data
    });
    return trx('fundraisers').where({ id, college_id: collegeId }).first();
  },

  findFundraiserById: async (id, collegeId, trx = db) => {
    let query = trx('fundraisers')
      .select('fundraisers.*', 'users.name as creator_name')
      .leftJoin('users', 'fundraisers.created_by', 'users.id')
      .where('fundraisers.id', id);

    query = applyTenantScope(query, collegeId, 'fundraisers');
    return query.first();
  },

  findAllFundraisers: async (collegeId, { status, offset = 0, limit = 10 }, trx = db) => {
    let query = trx('fundraisers')
      .select('fundraisers.*', 'users.name as creator_name')
      .leftJoin('users', 'fundraisers.created_by', 'users.id');

    query = applyTenantScope(query, collegeId, 'fundraisers');

    if (status) {
      query = query.where('fundraisers.status', status);
    }

    return query.orderBy('fundraisers.created_at', 'desc').offset(offset).limit(limit);
  },

  countFundraisers: async (collegeId, { status }, trx = db) => {
    let query = trx('fundraisers');
    query = applyTenantScope(query, collegeId);

    if (status) {
      query = query.where('status', status);
    }

    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  updateFundraiser: async (id, collegeId, updateData, trx = db) => {
    let query = trx('fundraisers').where('id', id);
    query = applyTenantScope(query, collegeId);
    await query.update(updateData);
    return trx('fundraisers').where({ id, college_id: collegeId }).first();
  },

  // --- Fundraiser Tasks ---
  createTask: async (collegeId, taskData, trx = db) => {
    const [id] = await trx('fundraiser_tasks').insert({
      college_id: collegeId,
      ...taskData
    });
    return trx('fundraiser_tasks').where({ id, college_id: collegeId }).first();
  },

  findTaskById: async (id, collegeId, trx = db) => {
    let query = trx('fundraiser_tasks')
      .select('fundraiser_tasks.*', 'users.name as assignee_name', 'users.email as assignee_email')
      .leftJoin('users', 'fundraiser_tasks.assignee_id', 'users.id')
      .where('fundraiser_tasks.id', id);

    query = applyTenantScope(query, collegeId, 'fundraiser_tasks');
    return query.first();
  },

  findTasksByFundraiser: async (fundraiserId, collegeId, trx = db) => {
    let query = trx('fundraiser_tasks')
      .select('fundraiser_tasks.*', 'users.name as assignee_name', 'users.email as assignee_email')
      .leftJoin('users', 'fundraiser_tasks.assignee_id', 'users.id')
      .where('fundraiser_tasks.fundraiser_id', fundraiserId);

    query = applyTenantScope(query, collegeId, 'fundraiser_tasks');
    return query.orderBy('fundraiser_tasks.created_at', 'asc');
  },

  findStudentTasks: async (studentId, collegeId, { offset = 0, limit = 20 }, trx = db) => {
    let query = trx('fundraiser_tasks')
      .select(
        'fundraiser_tasks.*',
        'fundraisers.title as fundraiser_title',
        'fundraisers.organization',
        'fundraisers.status as fundraiser_status',
        'fundraisers.event_id',
        'events.name as event_name'
      )
      .join('fundraisers', 'fundraiser_tasks.fundraiser_id', 'fundraisers.id')
      .leftJoin('events', 'fundraisers.event_id', 'events.id')
      .where('fundraiser_tasks.assignee_id', studentId);

    query = applyTenantScope(query, collegeId, 'fundraiser_tasks');
    return query.orderBy('fundraiser_tasks.created_at', 'desc').offset(offset).limit(limit);
  },

  countStudentTasks: async (studentId, collegeId, trx = db) => {
    let query = trx('fundraiser_tasks').where('assignee_id', studentId);
    query = applyTenantScope(query, collegeId);
    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  updateTask: async (id, collegeId, updateData, trx = db) => {
    let query = trx('fundraiser_tasks').where('id', id);
    query = applyTenantScope(query, collegeId);
    await query.update(updateData);
    return trx('fundraiser_tasks').where({ id, college_id: collegeId }).first();
  },

  respondToInvitation: async (taskId, studentId, collegeId, action, trx = db) => {
    let query = trx('fundraiser_tasks').where({
      id: taskId,
      assignee_id: studentId
    });
    query = applyTenantScope(query, collegeId);
    const task = await query.first();
    if (!task) {
      const AppError = require('../utils/appError');
      throw new AppError('Volunteer invitation not found', 404);
    }

    if (task.invitation_deadline) {
      const today = new Date().toISOString().split('T')[0];
      if (task.invitation_deadline < today) {
        await query.update({ invitation_status: 'expired' });
        const AppError = require('../utils/appError');
        throw new AppError('This volunteer invitation deadline has passed and is expired', 400);
      }
    }

    const newInvStatus = action === 'accept' ? 'accepted' : 'declined';
    const newTaskStatus = action === 'accept' ? 'in_progress' : 'completed';

    await query.update({
      invitation_status: newInvStatus,
      status: newTaskStatus
    });

    return query.first();
  },

  checkIfStudentIsVolunteerForEvent: async (studentId, eventId, collegeId, trx = db) => {
    let query = trx('fundraiser_tasks')
      .join('fundraisers', 'fundraiser_tasks.fundraiser_id', 'fundraisers.id')
      .where('fundraiser_tasks.assignee_id', studentId)
      .where('fundraisers.event_id', eventId)
      .whereIn('fundraiser_tasks.invitation_status', ['pending', 'accepted']);

    query = applyTenantScope(query, collegeId, 'fundraiser_tasks');
    const match = await query.first();
    return Boolean(match);
  },

  getProgressSummary: async (fundraiserId, collegeId, trx = db) => {
    let query = trx('fundraiser_tasks').where('fundraiser_id', fundraiserId);
    query = applyTenantScope(query, collegeId);

    const totalTasks = await query.clone().count('id as count').first();
    const pendingTasks = await query.clone().where('status', FUNDRAISER_TASK_STATUS.PENDING).count('id as count').first();
    const inProgressTasks = await query.clone().where('status', FUNDRAISER_TASK_STATUS.IN_PROGRESS).count('id as count').first();
    const completedTasks = await query.clone().where('status', FUNDRAISER_TASK_STATUS.COMPLETED).count('id as count').first();

    const total = parseInt(totalTasks.count, 10) || 0;
    const completed = parseInt(completedTasks.count, 10) || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending: parseInt(pendingTasks.count, 10) || 0,
      inProgress: parseInt(inProgressTasks.count, 10) || 0,
      completed,
      completionPercentage: percentage
    };
  }
};

module.exports = fundraiserModel;
