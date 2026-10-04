const nodemailer = require('nodemailer');
const env = require('./env');

let transporter;

if (env.NODE_ENV === 'test' || !env.SMTP_HOST || env.SMTP_USER === 'mock_user') {
  transporter = {
    sendMail: async (mailOptions) => {
      // In-memory/mock transport for tests and local fallback
      return {
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        response: '250 Message accepted',
        envelope: { from: mailOptions.from, to: mailOptions.to }
      };
    }
  };
} else if (env.SMTP_HOST && (env.SMTP_HOST.includes('gmail') || (env.SMTP_USER && env.SMTP_USER.endsWith('@gmail.com')))) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
} else {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
}

module.exports = transporter;
