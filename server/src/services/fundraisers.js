const db = require('../config/database');
const fundraiserModel = require('../models/fundraiser');
const userModel = require('../models/user');
const membershipModel = require('../models/membership');
const emailLogModel = require('../models/emailLog');
const announcementModel = require('../models/announcement');
const { sendMail } = require('./email');
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
      organization: data.organization || 'Odoo Student Association',
      event_id: data.event_id ? parseInt(data.event_id, 10) : null,
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
   * Retrieves tasks for a specific fundraiser.
   */
  getTasksByFundraiser: async (fundraiserId, collegeId) => {
    const fundraiser = await fundraiserModel.findFundraiserById(fundraiserId, collegeId);
    if (!fundraiser) {
      throw new AppError('Volunteer project not found', 404);
    }
    return fundraiserModel.findTasksByFundraiser(fundraiserId, collegeId);
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
   * Creates a volunteer invitation/task assigned to an active association member.
   * Ensures the student is an active member AND not already an attendee in the event.
   */
  createTask: async (
    collegeId,
    fundraiserId,
    { title, description, assignee_id, due_date, invitation_deadline }
  ) => {
    const fundraiser = await fundraiserModel.findFundraiserById(fundraiserId, collegeId);
    if (!fundraiser) {
      throw new AppError('Volunteer project not found', 404);
    }

    const assignee = await userModel.findById(assignee_id, collegeId);
    if (!assignee || assignee.role !== ROLES.STUDENT) {
      throw new AppError('Assignee must be a student of the same college', 400);
    }

    // 1. Verify student is an active member of the association
    const membership = await membershipModel.getActiveMembership(assignee_id, collegeId);
    if (!membership) {
      throw new AppError(
        `Student ${assignee.name} is not an active member. Only active student association members can be invited as volunteers.`,
        400
      );
    }

    // 2. Verify student is NOT already participating in this event as an attendee
    if (fundraiser.event_id) {
      const registrationModel = require('../models/registration');
      const attendeeReg = await registrationModel.findByEventAndUser(
        fundraiser.event_id,
        assignee_id,
        collegeId
      );
      if (attendeeReg && attendeeReg.status !== 'cancelled') {
        throw new AppError(
          `Student ${assignee.name} is already registered as a participating attendee for this event and cannot be assigned as a volunteer.`,
          400
        );
      }
    }

    let dueDate = due_date;
    if (dueDate && dueDate.includes('T')) {
      dueDate = dueDate.split('T')[0];
    }

    let invDeadline = invitation_deadline || dueDate || null;
    if (invDeadline && invDeadline.includes('T')) {
      invDeadline = invDeadline.split('T')[0];
    }

    const createdTask = await fundraiserModel.createTask(collegeId, {
      fundraiser_id: fundraiserId,
      title,
      description: description || '',
      assignee_id,
      due_date: dueDate || null,
      invitation_deadline: invDeadline,
      invitation_status: 'pending'
    });

    // 1. Dispatch actual email notification & record in email log
    try {
      const emailSubject = `Volunteer Invitation: ${title} (${fundraiser.organization || 'Odoo Student Association'})`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Volunteer Invitation</h2>
          <p>Hello <strong>${assignee.name}</strong>,</p>
          <p>You have been invited to volunteer for <strong>${fundraiser.title}</strong> by ${
            fundraiser.organization || 'Odoo Student Association'
          }.</p>
          <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #4f46e5; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0;"><strong>Role & Duties:</strong> ${title}</p>
            <p style="margin: 0 0 8px 0;"><strong>Instructions:</strong> ${
              description || 'Please follow instructions provided by your organizer.'
            }</p>
            <p style="margin: 0;"><strong>Invitation Response Deadline:</strong> ${
              invDeadline || 'Immediate'
            }</p>
          </div>
          <p>Please sign in to your student dashboard to review and accept your volunteer invitation.</p>
          <p style="margin-top: 24px; color: #64748b; font-size: 14px;">Best regards,<br/>${
            fundraiser.organization || 'Odoo Student Association'
          }</p>
        </div>
      `;
      const emailText = `Hello ${assignee.name},\n\nYou have been invited to volunteer for "${fundraiser.title}" by ${
        fundraiser.organization || 'Odoo Student Association'
      }.\n\nRole & Duties: ${title}\nInstructions: ${
        description || 'Please follow instructions provided by your organizer.'
      }\nInvitation Response Deadline: ${
        invDeadline || 'Immediate'
      }\n\nPlease sign in to your student dashboard to review and accept your volunteer invitation.\n\nBest regards,\nOdoo Student Association`;

      const mailResult = await sendMail({
        to: `"${assignee.name}" <${assignee.email}>`,
        subject: emailSubject,
        html: emailHtml,
        text: emailText
      });

      await emailLogModel.create(collegeId, {
        recipient: assignee.email,
        subject: emailSubject,
        status: mailResult.success ? 'sent' : 'failed',
        error: mailResult.error || null
      });
    } catch (err) {
      console.warn('Failed to dispatch or record volunteer task email', err?.message);
    }

    // 2. Broadcast Announcement for the student
    try {
      await announcementModel.create(collegeId, {
        title: `Volunteer Invitation: ${title}`,
        message: `Active member ${assignee.name} has been invited as volunteer for "${fundraiser.title}". Response deadline: ${
          invDeadline || 'Open'
        }.`,
        posted_by: fundraiser.created_by,
        priority: 'INFO'
      });
    } catch (err) {
      console.warn('Failed to create volunteer task announcement', err?.message);
    }

    return createdTask;
  },

  /**
   * Retrieves list of registered students who are active members of this organization
   * and optionally filters out students already registered as attendees for an event.
   */
  listAvailableStudents: async (collegeId, eventId = null) => {
    let students = await membershipModel.findActiveMembersByCollege(collegeId);
    if (eventId) {
      const registeredUserIds = await db('registrations')
        .where('event_id', eventId)
        .where('college_id', collegeId)
        .whereNot('status', 'cancelled')
        .pluck('user_id');

      students = students.filter((s) => !registeredUserIds.includes(s.id));
    }
    return students;
  },

  /**
   * Allows student to accept or decline a volunteer invitation before deadline.
   */
  respondToInvitation: async (taskId, studentId, collegeId, action) => {
    return fundraiserModel.respondToInvitation(taskId, studentId, collegeId, action);
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

    // Only allow status updates (including completed) after the student accepts the invitation
    if (task.invitation_status !== 'accepted') {
      throw new AppError(
        `Task status cannot be changed to "${status}" until the student accepts the volunteer invitation (Current status: ${task.invitation_status || 'pending'}).`,
        400
      );
    }

    return fundraiserModel.updateTask(taskId, collegeId, { status });
  }
};

module.exports = fundraisersService;
