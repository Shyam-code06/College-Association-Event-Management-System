const fundraiserModel = require('../models/fundraiser');
const userModel = require('../models/user');
const { ROLES } = require('../constants/roles');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const fundraisersService = {
  /**
   * Creates a new fundraiser (College Admin).
   */
  createFundraiser: async (collegeId, creatorId, data) => {
    return fundraiserModel.createFundraiser(collegeId, {
      ...data,
      created_by: creatorId
    });
  },

  /**
   * Lists fundraisers for the college.
   */
  listFundraisers: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const fundraisers = await fundraiserModel.findAllFundraisers(collegeId, {
      status: queryParams.status,
      offset,
      limit
    });
    const total = await fundraiserModel.countFundraisers(collegeId, { status: queryParams.status });

    // Include progress summary with each fundraiser
    const fundraisersWithProgress = await Promise.all(
      fundraisers.map(async (f) => {
        const progress = await fundraiserModel.getProgressSummary(f.id, collegeId);
        return {
          ...f,
          progress
        };
      })
    );

    return {
      data: fundraisersWithProgress,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Retrieves single fundraiser by ID with progress and tasks.
   */
  getFundraiserById: async (id, collegeId) => {
    const fundraiser = await fundraiserModel.findFundraiserById(id, collegeId);
    if (!fundraiser) {
      throw new AppError('Fundraiser not found', 404);
    }

    const progress = await fundraiserModel.getProgressSummary(id, collegeId);
    const tasks = await fundraiserModel.findTasksByFundraiser(id, collegeId);

    return {
      ...fundraiser,
      progress,
      tasks
    };
  },

  /**
   * Updates fundraiser details or status.
   */
  updateFundraiser: async (id, collegeId, updateData) => {
    const fundraiser = await fundraiserModel.findFundraiserById(id, collegeId);
    if (!fundraiser) {
      throw new AppError('Fundraiser not found', 404);
    }

    return fundraiserModel.updateFundraiser(id, collegeId, updateData);
  },

  /**
   * Creates a task assigned to a student of the same college.
   */
  createTask: async (collegeId, fundraiserId, { title, description, assignee_id, due_date }) => {
    const fundraiser = await fundraiserModel.findFundraiserById(fundraiserId, collegeId);
    if (!fundraiser) {
      throw new AppError('Fundraiser not found', 404);
    }

    const assignee = await userModel.findById(assignee_id, collegeId);
    if (!assignee || assignee.role !== ROLES.STUDENT) {
      throw new AppError('Assignee must be a student of the same college', 400);
    }

    return fundraiserModel.createTask(collegeId, {
      fundraiser_id: fundraiserId,
      title,
      description,
      assignee_id,
      due_date
    });
  },

  /**
   * Retrieves tasks assigned to the authenticated student.
   */
  getStudentTasks: async (studentId, collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const tasks = await fundraiserModel.findStudentTasks(studentId, collegeId, { offset, limit });
    const total = await fundraiserModel.countStudentTasks(studentId, collegeId);

    return {
      data: tasks,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Updates task status.
   * Students can only update tasks assigned to them; College Admin can update any.
   */
  updateTaskStatus: async (taskId, collegeId, user, status) => {
    const task = await fundraiserModel.findTaskById(taskId, collegeId);
    if (!task) {
      throw new AppError('Fundraiser task not found', 404);
    }

    if (user.role === ROLES.STUDENT && task.assignee_id !== user.id) {
      throw new AppError('You are only authorized to update your own assigned tasks', 403);
    }

    return fundraiserModel.updateTask(taskId, collegeId, { status });
  }
};

module.exports = fundraisersService;
