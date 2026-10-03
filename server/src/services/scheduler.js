const cron = require('node-cron');
const registrationModel = require('../models/registration');
const membershipModel = require('../models/membership');
const paymentModel = require('../models/payment');
const emailService = require('./email');
const logger = require('../utils/logger');
const { REGISTRATION_STATUS, PAYMENT_STATUS, MEMBERSHIP_STATUS } = require('../constants/statuses');
const db = require('../config/database');

let scheduledJobs = [];

/**
 * Initializes and starts all background cron jobs.
 */
const startScheduler = () => {
  // 1. Release unpaid reservations every 5 minutes (threshold: 15 mins)
  const reservationCleaner = cron.schedule('*/5 * * * *', async () => {
    try {
      const expiredList = await registrationModel.findExpiredReservations(15);
      if (expiredList && expiredList.length > 0) {
        for (const reg of expiredList) {
          await db.transaction(async (trx) => {
            await registrationModel.update(
              reg.id,
              reg.college_id,
              { status: REGISTRATION_STATUS.CANCELLED },
              trx
            );

            // Fail any pending payment
            const pendingPayment = await paymentModel.findByPayable(
              'registration',
              reg.id,
              reg.college_id,
              trx
            );
            if (pendingPayment && pendingPayment.status === PAYMENT_STATUS.PENDING) {
              await paymentModel.update(
                pendingPayment.id,
                reg.college_id,
                { status: PAYMENT_STATUS.FAILED },
                trx
              );
            }
          });
        }
        logger.info(`Released ${expiredList.length} expired unpaid event reservations`);
      }
    } catch (err) {
      logger.error(`Error in reservationCleaner cron: ${err.message}`);
    }
  });

  // 2. Mark expired memberships daily at midnight
  const membershipExpiryJob = cron.schedule('0 0 * * *', async () => {
    try {
      const expiredMemberships = await membershipModel.findExpiredActiveMemberships();
      if (expiredMemberships && expiredMemberships.length > 0) {
        for (const mem of expiredMemberships) {
          await membershipModel.updateMembership(mem.id, mem.college_id, {
            status: MEMBERSHIP_STATUS.EXPIRED
          });
        }
        logger.info(`Marked ${expiredMemberships.length} memberships as expired`);
      }
    } catch (err) {
      logger.error(`Error in membershipExpiryJob cron: ${err.message}`);
    }
  });

  // 3. Send renewal reminders 7 days before expiry daily at 09:00 AM
  const membershipReminderJob = cron.schedule('0 9 * * *', async () => {
    try {
      const expiringList = await membershipModel.findExpiringMemberships(7);
      if (expiringList && expiringList.length > 0) {
        for (const mem of expiringList) {
          await emailService.sendMail({
            to: mem.email,
            subject: 'Skyline Membership Renewal Reminder',
            text: `Dear ${mem.name}, your association membership expires on ${mem.expiry_date}. Please renew to keep your active benefits.`
          });

          await membershipModel.updateMembership(mem.id, mem.college_id, {
            reminder_sent_at: db.fn.now()
          });
        }
        logger.info(`Sent ${expiringList.length} membership renewal reminders`);
      }
    } catch (err) {
      logger.error(`Error in membershipReminderJob cron: ${err.message}`);
    }
  });

  scheduledJobs = [reservationCleaner, membershipExpiryJob, membershipReminderJob];
  logger.info('Scheduler started: 3 cron jobs initialized');
};

/**
 * Stops all scheduled cron jobs gracefully.
 */
const stopScheduler = () => {
  for (const job of scheduledJobs) {
    if (job) job.stop();
  }
  scheduledJobs = [];
  logger.info('Scheduler stopped all background jobs');
};

module.exports = {
  startScheduler,
  stopScheduler
};
