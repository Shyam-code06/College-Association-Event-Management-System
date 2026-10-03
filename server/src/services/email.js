const transporter = require('../config/mail');
const env = require('../config/env');
const emailLogModel = require('../models/emailLog');
const userModel = require('../models/user');
const logger = require('../utils/logger');

/**
 * Sends a single email with optional retry.
 *
 * @param {object} options - { to, subject, html, text }
 * @param {number} maxRetries
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
const sendMail = async (options, maxRetries = 2) => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html || options.text || ''
      });
      return { success: true, error: null };
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) {
        return { success: false, error: err.message };
      }
      // Brief exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
};

/**
 * Dispatches event notification emails asynchronously to active students of the college.
 * Sends in batches to prevent server blocking.
 *
 * @param {number} collegeId
 * @param {object} eventDetails
 */
const sendEventNotificationAsync = async (collegeId, eventDetails) => {
  // Fire and forget - runs completely in background
  setImmediate(async () => {
    try {
      const students = await userModel.findActiveStudentsByCollege(collegeId);
      if (!students || students.length === 0) {
        return;
      }

      const subject = `New Event Announced: ${eventDetails.name}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2563eb;">${eventDetails.name}</h2>
          <p>${eventDetails.description || 'You are invited to join our upcoming association event!'}</p>
          <table style="width: 100%; max-width: 500px; margin: 20px 0; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">Date:</td><td style="padding: 8px;">${eventDetails.event_date}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Time:</td><td style="padding: 8px;">${eventDetails.start_time}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Location:</td><td style="padding: 8px;">${eventDetails.location}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Capacity:</td><td style="padding: 8px;">${eventDetails.capacity} seats</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Member Price:</td><td style="padding: 8px;">₹${parseFloat(eventDetails.member_price).toFixed(2)}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Non-Member Price:</td><td style="padding: 8px;">₹${parseFloat(eventDetails.non_member_price).toFixed(2)}</td></tr>
          </table>
          <p>Login to your student portal to reserve your ticket now!</p>
        </div>
      `;

      const batchSize = 50;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        const logEntries = [];

        await Promise.all(
          batch.map(async (student) => {
            const result = await sendMail({
              to: student.email,
              subject,
              html: htmlContent,
              text: `Event: ${eventDetails.name} on ${eventDetails.event_date} at ${eventDetails.start_time}, ${eventDetails.location}`
            });

            logEntries.push({
              recipient: student.email,
              subject,
              status: result.success ? 'sent' : 'failed',
              error: result.error
            });
          })
        );

        if (logEntries.length > 0) {
          await emailLogModel.createBatch(collegeId, logEntries);
        }
      }
    } catch (err) {
      logger.error(`Error in sendEventNotificationAsync for college ${collegeId}: ${err.message}`);
    }
  });
};

module.exports = {
  sendMail,
  sendEventNotificationAsync
};
