const registrationModel = require('../models/registration');
const paymentModel = require('../models/payment');
const { generateQrDataUrl } = require('./qr');
const { REGISTRATION_STATUS, PAYMENT_STATUS, CHECKIN_ERROR } = require('../constants/statuses');
const AppError = require('../utils/appError');

const ticketsService = {
  /**
   * Generates QR Code Data URL for an owned registration ticket.
   *
   * @param {number} registrationId
   * @param {number} userId
   * @param {number} collegeId
   */
  getTicketQrCode: async (registrationId, userId, collegeId) => {
    const registration = await registrationModel.findById(registrationId, collegeId);
    if (!registration) {
      throw new AppError('Ticket registration not found', 404);
    }

    if (registration.user_id !== userId) {
      throw new AppError('You are not authorized to view this ticket', 403);
    }

    if (registration.status !== REGISTRATION_STATUS.CONFIRMED) {
      throw new AppError('Ticket is not confirmed. Payment or reservation is pending.', 400);
    }

    const qrDataUrl = await generateQrDataUrl(registration.qr_token);

    return {
      registrationId: registration.id,
      eventName: registration.event_name,
      eventDate: registration.event_date,
      qrToken: registration.qr_token,
      qrDataUrl
    };
  },

  /**
   * Validates and performs check-in via QR scan.
   * Usable by Organizer or College Admin.
   *
   * @param {number} collegeId
   * @param {number} scannerId
   * @param {object} payload - { qrToken, eventId }
   */
  scanAndCheckIn: async (collegeId, scannerId, { qrToken, eventId }) => {
    // 1. Token exists within scanner's college
    const registration = await registrationModel.findByQrToken(qrToken, collegeId);
    if (!registration) {
      return {
        success: false,
        reason: CHECKIN_ERROR.INVALID_TICKET,
        message: 'Invalid ticket or ticket does not belong to this college'
      };
    }

    // 2. Event matches
    if (registration.event_id !== parseInt(eventId, 10)) {
      return {
        success: false,
        reason: CHECKIN_ERROR.WRONG_EVENT,
        message: 'Ticket is registered for a different event'
      };
    }

    // 3. Registration confirmed
    if (registration.status !== REGISTRATION_STATUS.CONFIRMED) {
      return {
        success: false,
        reason: CHECKIN_ERROR.PAYMENT_PENDING,
        message: 'Registration is not confirmed'
      };
    }

    // 4. Payment success (if paid)
    if (registration.is_paid && registration.price_charged > 0) {
      const payment = await paymentModel.findByPayable('registration', registration.id, collegeId);
      if (!payment || payment.status !== PAYMENT_STATUS.SUCCESS) {
        return {
          success: false,
          reason: CHECKIN_ERROR.PAYMENT_PENDING,
          message: 'Payment has not been completed for this ticket'
        };
      }
    }

    // 5. Check if already checked in
    if (registration.checked_in_at !== null) {
      return {
        success: false,
        reason: CHECKIN_ERROR.ALREADY_USED,
        message: 'Ticket has already been scanned and checked in',
        checkedInAt: registration.checked_in_at
      };
    }

    // 6. Atomic conditional check-in to prevent double scan race condition
    const checkInSuccess = await registrationModel.atomicCheckIn(
      registration.id,
      collegeId,
      scannerId
    );

    if (!checkInSuccess) {
      return {
        success: false,
        reason: CHECKIN_ERROR.ALREADY_USED,
        message: 'Ticket was just checked in concurrently'
      };
    }

    return {
      success: true,
      message: 'Check-in successful',
      attendee: {
        name: registration.user_name,
        email: registration.user_email,
        eventName: registration.event_name,
        isMember: Boolean(registration.is_member_at_registration),
        checkedInAt: new Date().toISOString()
      }
    };
  }
};

module.exports = ticketsService;
