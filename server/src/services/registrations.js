const db = require('../config/database');
const eventModel = require('../models/event');
const registrationModel = require('../models/registration');
const membershipModel = require('../models/membership');
const paymentModel = require('../models/payment');
const { generateTicketToken } = require('./qr');
const { generateTransactionRef } = require('./mockPayment');
const {
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
  PAYABLE_TYPE,
  EVENT_STATUS
} = require('../constants/statuses');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const registrationsService = {
  /**
   * Registers a student for an event.
   * Locked row transaction preventing race conditions and overselling.
   *
   * @param {number} userId
   * @param {number} collegeId
   * @param {number} eventId
   */
  registerForEvent: async (userId, collegeId, eventId) => {
    return db.transaction(async (trx) => {
      // 1. Lock event row for update within tenant
      const event = await eventModel.findByIdForUpdate(eventId, collegeId, trx);
      if (!event) {
        throw new AppError('Event not found', 404);
      }

      if (event.status !== EVENT_STATUS.PUBLISHED) {
        throw new AppError(`Event is not open for registration (status: ${event.status})`, 400);
      }

      // 2. Check for duplicate registration
      const existingRegistration = await registrationModel.findByEventAndUser(
        eventId,
        userId,
        collegeId,
        trx
      );
      if (existingRegistration && existingRegistration.status !== REGISTRATION_STATUS.CANCELLED) {
        throw new AppError('You are already registered for this event', 409);
      }

      // 3. Check capacity against active registrations (reserved or confirmed)
      const availableSeats = await eventModel.getAvailableSeats(
        eventId,
        event.capacity,
        collegeId,
        trx
      );
      if (availableSeats <= 0) {
        throw new AppError('This event is completely sold out', 400);
      }

      // 4. Determine active membership status to decide pricing
      const activeMembership = await membershipModel.getActiveMembership(userId, collegeId, trx);
      const isMember = Boolean(activeMembership);

      let priceCharged = 0;
      if (event.is_paid) {
        priceCharged = isMember
          ? parseFloat(event.member_price)
          : parseFloat(event.non_member_price);
      }

      const isFree = !event.is_paid || priceCharged === 0;
      const status = isFree ? REGISTRATION_STATUS.CONFIRMED : REGISTRATION_STATUS.RESERVED;
      const qrToken = generateTicketToken();

      let registration;
      if (existingRegistration && existingRegistration.status === REGISTRATION_STATUS.CANCELLED) {
        // Reuse record if previously cancelled
        registration = await registrationModel.update(
          existingRegistration.id,
          collegeId,
          {
            price_charged: priceCharged,
            is_member_at_registration: isMember,
            status,
            qr_token: qrToken,
            checked_in_at: null,
            checked_in_by: null
          },
          trx
        );
      } else {
        registration = await registrationModel.create(
          collegeId,
          {
            event_id: eventId,
            user_id: userId,
            price_charged: priceCharged,
            is_member_at_registration: isMember,
            status,
            qr_token: qrToken
          },
          trx
        );
      }

      let payment = null;
      if (!isFree) {
        payment = await paymentModel.create(
          collegeId,
          {
            user_id: userId,
            payable_type: PAYABLE_TYPE.REGISTRATION,
            payable_id: registration.id,
            amount: priceCharged,
            status: PAYMENT_STATUS.PENDING,
            transaction_ref: generateTransactionRef()
          },
          trx
        );
      }

      return {
        registration: {
          ...registration,
          is_member_at_registration: Boolean(registration.is_member_at_registration)
        },
        payment,
        requiresPayment: !isFree
      };
    });
  },

  /**
   * Retrieves a student's registrations.
   */
  getStudentRegistrations: async (userId, collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const registrations = await registrationModel.findStudentRegistrations(userId, collegeId, {
      offset,
      limit
    });
    const total = await registrationModel.countStudentRegistrations(userId, collegeId);

    return {
      data: registrations,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Retrieves all registrations for an event (College Admin & Organizers).
   */
  getEventRegistrations: async (eventId, collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const registrations = await registrationModel.findEventRegistrations(eventId, collegeId, {
      status: queryParams.status,
      offset,
      limit
    });

    return {
      data: registrations,
      meta: buildPaginationMeta(registrations.length, page, limit)
    };
  }
};

module.exports = registrationsService;
