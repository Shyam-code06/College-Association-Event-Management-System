const eventModel = require('../models/event');
const registrationModel = require('../models/registration');
const financeModel = require('../models/finance');
const membershipModel = require('../models/membership');
const { ROLES } = require('../constants/roles');
const AppError = require('../utils/appError');

const reportsService = {
  /**
   * Retrieves event-specific performance report:
   * Registrations, attendees, member vs non-member attendees, ticket revenue.
   *
   * @param {number} eventId
   * @param {number} collegeId
   * @param {object} user - Authenticated user object
   */
  getEventReport: async (eventId, collegeId, user) => {
    const event = await eventModel.findById(eventId, collegeId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Organizers can only view reports for events they created
    if (user.role === ROLES.ORGANIZER && event.created_by !== user.id) {
      throw new AppError('Organizers can only view reports for events they created', 403);
    }

    const stats = await registrationModel.getEventReportStats(eventId, collegeId);

    return {
      event: {
        id: event.id,
        name: event.name,
        date: event.event_date,
        capacity: event.capacity,
        isPaid: Boolean(event.is_paid),
        memberPrice: parseFloat(event.member_price),
        nonMemberPrice: parseFloat(event.non_member_price)
      },
      metrics: {
        totalRegistrations: stats.totalRegistrations,
        confirmedRegistrations: stats.confirmedRegistrations,
        totalAttendees: stats.attendees,
        attendanceRate: stats.confirmedRegistrations > 0
          ? `${Math.round((stats.attendees / stats.confirmedRegistrations) * 100)}%`
          : '0%',
        memberAttendees: stats.memberAttendees,
        nonMemberAttendees: stats.nonMemberAttendees,
        ticketRevenue: stats.ticketRevenue
      }
    };
  },

  /**
   * College-level dashboard overview report (College Admin only).
   */
  getCollegeOverviewReport: async (collegeId) => {
    const totalMembers = await membershipModel.countMembers(collegeId, {});
    const activeMembers = await membershipModel.countMembers(collegeId, { status: 'active' });
    const totalEvents = await eventModel.count(collegeId, {});
    const financeSummary = await financeModel.getFinanceSummary(collegeId, {});

    return {
      membership: {
        total: totalMembers,
        active: activeMembers
      },
      events: {
        total: totalEvents
      },
      finance: {
        totalIncome: financeSummary.totalIncome,
        totalExpenses: financeSummary.totalExpenses,
        balance: financeSummary.balance
      }
    };
  }
};

module.exports = reportsService;
