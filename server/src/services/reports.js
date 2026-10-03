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

    // Organizers and College Admins can view reports for events in their college
    // (collegeId tenancy is verified by eventModel.findById)

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
      },
      // Flat properties expected by EventReport frontend charts & stats
      capacity: event.capacity,
      total_registered: stats.totalRegistrations,
      checked_in: stats.attendees,
      total_revenue: stats.ticketRevenue,
      member_registrations: stats.memberAttendees
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

    // Metrics for graphs and overview dashboard cards
    const orderModel = require('../models/order');
    const expenseModel = require('../models/expense');
    const fundraiserModel = require('../models/fundraiser');
    const userModel = require('../models/user');
    const db = require('../config/database');

    const regCountRes = await db('registrations')
      .where('college_id', collegeId)
      .count('id as count')
      .first();
    const totalRegistrations = parseInt(regCountRes?.count || 0, 10);

    const totalOrders = await orderModel.countOrders(collegeId, {});
    const pendingExpenses = await expenseModel.count(collegeId, { status: 'pending' });
    const activeOrganizers = await userModel.countCollegeUsers(collegeId, { role: ROLES.ORGANIZER });
    const activeFundraisers = await fundraiserModel.countFundraisers(collegeId, { status: 'active' });

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
      },
      // Flat properties expected by Frontend Dashboard Cards & Recharts
      total_members: activeMembers || totalMembers,
      total_events: totalEvents,
      total_registrations: totalRegistrations,
      total_revenue: financeSummary.totalIncome,
      total_orders: totalOrders,
      pending_expenses: pendingExpenses,
      active_organizers: activeOrganizers,
      active_fundraisers: activeFundraisers
    };
  }
};

module.exports = reportsService;
