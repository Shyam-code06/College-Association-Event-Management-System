const fundraiserModel = require('../models/fundraiser');
const userModel = require('../models/user');
const membershipModel = require('../models/membership');
const emailLogModel = require('../models/emailLog');
const announcementModel = require('../models/announcement');
const { ROLES } = require('../constants/roles');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const fundraisersService = {
  /**
   * Creates a new volunteer project / fundraiser (College Admin & Organizer).
   */
  createFundraiser: async (collegeId, creatorId, data) => {
    const goalAmount = data.goal_amount !== undefined ? data.goal_amount : (data.target_amount !== undefined ? data.target_amount : 1);
    const startDate = data.start_date
      ? (data.start_date.includes('T') ? data.start_date.split('T')[0] : data.start_date)
      : new Date().toISOString().split('T')[0];
    let endDate = data.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    if (endDate && endDate.includes('T')) {
      endDate = endDate.split('T')[0];
    }

    return fundraiserModel.createFundraiser(collegeId, {
      title: data.title,
      description: data.description || '',
      goal_amount: parseFloat(goalAmount),
      start_date: startDate,
      end_date: endDate,
      status: data.status || 'active',
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

    // Verify student is an active member of this organization
    const membership = await membershipModel.getActiveMembership(assignee_id, collegeId);
    if (!membership) {
      throw new AppError(`Student ${assignee.name} is not an active member of this student association. Only association members can be assigned as volunteers.`, 400);
    }

    let dueDate = due_date;
    if (dueDate && dueDate.includes('T')) {
      dueDate = dueDate.split('T')[0];
    }

    const createdTask = await fundraiserModel.createTask(collegeId, {
      fundraiser_id: fundraiserId,
      title,
      description: description || '',
      assignee_id,
      due_date: dueDate || null
    });

    // 1. Notify student via Email Log
    try {
      await emailLogModel.create(collegeId, {
        recipient: assignee.email,
        subject: `New Volunteer Task Assigned: ${title}`,
        body: `Hello ${assignee.name},\n\nYou have been assigned as a student volunteer for "${fundraiser.title}".\n\nTask Details:\n• Task: ${title}\n• Instructions: ${description || 'Follow instructions provided by your organizer.'}\n• Due Date: ${dueDate || 'Ongoing / ASAP'}\n\nPlease check your student dashboard under "My Tasks" to track progress.\n\nBest regards,\nSkyline Student Association`,
        status: 'SENT'
      });
    } catch (err) {
      console.warn('Failed to record volunteer task email log', err?.message);
    }

    // 2. Broadcast Announcement for the student
    try {
      await announcementModel.create(collegeId, {
        title: `Volunteer Task: ${title}`,
        content: `Student volunteer ${assignee.name} has been assigned to task "${title}" for "${fundraiser.title}". Due date: ${dueDate || 'Ongoing'}.`,
        target_audience: 'STUDENTS',
        created_by: fundraiser.created_by
      });
    } catch (err) {
      console.warn('Failed to create volunteer task announcement', err?.message);
    }

    return createdTask;
  },

  /**
   * Retrieves list of registered students who are active members of this organization.
   */
  listAvailableStudents: async (collegeId) => {
    return membershipModel.findActiveMembersByCollege(collegeId);
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
   * Students can only update tasks assigned to them; College Admin and Organizer can update any.
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
