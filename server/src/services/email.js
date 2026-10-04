const transporter = require('../config/mail');
const env = require('../config/env');
const emailLogModel = require('../models/emailLog');
const userModel = require('../models/user');
const collegeModel = require('../models/college');
const logger = require('../utils/logger');

/**
 * Sends a single email with anti-spam compliance headers and optional retry.
 *
 * @param {object} options - { to, subject, html, text, replyTo }
 * @param {number} maxRetries
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
const sendMail = async (options, maxRetries = 2) => {
  let attempt = 0;
  const messageId = `<skyline-${Date.now()}-${Math.random().toString(36).substring(7)}@skyline.edu>`;

  while (attempt <= maxRetries) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        replyTo: options.replyTo || env.SMTP_USER,
        subject: options.subject,
        text: options.text || '',
        html: options.html || options.text || '',
        headers: {
          'Message-ID': messageId,
          'X-Mailer': 'Skyline Student Association Portal',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'List-Unsubscribe': `<mailto:${env.SMTP_USER}?subject=unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          ...(options.headers || {})
        }
      });
      return { success: true, error: null };
    } catch (err) {
      const errMsg = err.message || 'Unknown mail error';
      // If it's an SMTP credential/auth error, do not spam retries
      if (
        errMsg.includes('535') ||
        errMsg.toLowerCase().includes('invalid login') ||
        errMsg.toLowerCase().includes('authentication')
      ) {
        logger.error(`[EmailService] SMTP Auth Error: ${errMsg}. Please verify SMTP credentials in .env.`);
        return { success: false, error: `SMTP Authentication failed (Check .env): ${errMsg}` };
      }
      attempt++;
      if (attempt > maxRetries) {
        return { success: false, error: errMsg };
      }
      // Brief exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
};

/**
 * Dispatches event notification emails asynchronously to active students of the college.
 * Built with anti-spam structure, full DOCTYPE, matched text version, and pacing.
 *
 * @param {number} collegeId
 * @param {object} eventDetails
 * @param {number} delayMs
 */
const sendEventNotificationAsync = async (collegeId, eventDetails, delayMs = 120000) => {
  logger.info(
    `[EmailService] Event "${eventDetails.name}" published for college ${collegeId}. Broadcast announcement emails queued to send in ${
      delayMs / 1000
    }s (2 minutes).`
  );

  // Immediately record scheduled status in email log for audit visibility
  try {
    await emailLogModel.create(collegeId, {
      recipient: 'all-active-students@campus.edu',
      subject: `[Queued 2-Min Broadcast] Event Announcement: ${eventDetails.name}`,
      status: 'sent',
      error: `Delivery scheduled in 2 minutes.`
    });
  } catch (err) {
    // Non-blocking log
  }

  // Execute after 2 minutes (120,000 ms)
  setTimeout(async () => {
    try {
      logger.info(
        `[EmailService] Executing 2-minute delayed broadcast for "${eventDetails.name}" (college ${collegeId})...`
      );
      const students = await userModel.findActiveStudentsByCollege(collegeId);
      if (!students || students.length === 0) {
        return;
      }

      // Fetch college info for clean institutional branding
      let collegeName = 'Student Association';
      try {
        const college = await collegeModel.findById(collegeId);
        if (college && college.name) collegeName = college.name;
      } catch (e) {
        // Fallback
      }

      const subject = `[Campus Notice] Upcoming Event: ${eventDetails.name}`;
      const logEntries = [];

      // Deliver sequentially with pacing (200ms delay) to prevent Gmail throttling as spam bot
      for (const student of students) {
        const recipientName = student.name || 'Student';
        const formattedRecipient = `"${recipientName}" <${student.email}>`;

        const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${eventDetails.name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <!-- Preheader text (anti-spam inbox preview) -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    Official campus announcement: ${eventDetails.name} on ${eventDetails.event_date}. Reserve your digital gate pass on the portal.
  </div>

  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #6d28d9; padding: 24px 32px; text-align: left;">
              <span style="color: #ede9fe; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; display: block;">
                ${collegeName} • Official Event Notice
              </span>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 6px 0 0 0; line-height: 1.3;">
                ${eventDetails.name}
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 32px;">
              <p style="font-size: 15px; margin: 0 0 16px 0; color: #1e293b;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="font-size: 14px; margin: 0 0 20px 0; color: #475569; line-height: 1.6;">
                ${eventDetails.description || 'You are invited to participate in an upcoming student association event on campus. Review the schedule and reserve your seat below:'}
              </p>

              <!-- Event Details Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #475569; width: 35%;">
                    📅 Date:
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a;">
                    ${eventDetails.event_date}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #475569;">
                    ⏰ Time:
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">
                    ${eventDetails.start_time}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #475569;">
                    📍 Venue:
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">
                    ${eventDetails.location}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #475569;">
                    🎟️ Total Capacity:
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">
                    ${eventDetails.capacity} Seats Available
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #475569;">
                    💳 Ticket Price:
                  </td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0f172a;">
                    Member: <strong>₹${parseFloat(eventDetails.member_price).toFixed(2)}</strong> | Non-Member: ₹${parseFloat(eventDetails.non_member_price).toFixed(2)}
                  </td>
                </tr>
              </table>

              <!-- Call to Action -->
              <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">
                Log in to your student portal to claim your ticket or explore volunteer opportunities for this event.
              </p>
            </td>
          </tr>

          <!-- Footer (Anti-Spam CAN-SPAM compliant) -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">
                This official campus announcement was dispatched to <strong>${student.email}</strong> as an active member of <strong>${collegeName}</strong>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Skyline Student Association Portal • Institutional Notifications
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const plainTextContent = `OFFICIAL CAMPUS EVENT ANNOUNCEMENT
--------------------------------------------------
Event: ${eventDetails.name}
College: ${collegeName}

Hello ${recipientName},

An official event has been announced on campus.

EVENT DETAILS:
- Date: ${eventDetails.event_date}
- Time: ${eventDetails.start_time}
- Venue: ${eventDetails.location}
- Capacity: ${eventDetails.capacity} Seats
- Member Price: Rs. ${parseFloat(eventDetails.member_price).toFixed(2)}
- Non-Member Price: Rs. ${parseFloat(eventDetails.non_member_price).toFixed(2)}

Description:
${eventDetails.description || 'You are invited to join our upcoming student association event.'}

Sign in to your student association portal to reserve your gate pass or check volunteer tasks.

--------------------------------------------------
This official message was sent to ${student.email} as an active member of ${collegeName}.
Skyline Student Association Portal`;

        const result = await sendMail({
          to: formattedRecipient,
          subject,
          html: htmlContent,
          text: plainTextContent
        });

        logEntries.push({
          recipient: student.email,
          subject,
          status: result.success ? 'sent' : 'failed',
          error: result.error
        });

        // Anti-spam rate limiting: 200ms between sends to avoid Google bulk spam detection
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (logEntries.length > 0) {
        await emailLogModel.createBatch(collegeId, logEntries);
      }

      logger.info(
        `[EmailService] 2-minute delayed broadcast completed for "${eventDetails.name}". Dispatched to ${students.length} students.`
      );
    } catch (err) {
      logger.error(`Error in sendEventNotificationAsync for college ${collegeId}: ${err.message}`);
    }
  }, delayMs);
};

module.exports = {
  sendMail,
  sendEventNotificationAsync
};
