const db = require('../config/database');

const otpModel = {
  createOtp: async (email, otp, expiresInMinutes = 10, trx = db) => {
    // Invalidate previous OTPs for this email
    await trx('password_reset_otps')
      .where({ email })
      .delete();

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const [id] = await trx('password_reset_otps').insert({
      email,
      otp,
      expires_at: expiresAt,
      is_verified: false
    });

    return trx('password_reset_otps').where({ id }).first();
  },

  findLatestValid: async (email, otp, trx = db) => {
    return trx('password_reset_otps')
      .where({ email, otp })
      .where('expires_at', '>', trx.fn.now())
      .orderBy('created_at', 'desc')
      .first();
  },

  markVerified: async (id, trx = db) => {
    await trx('password_reset_otps')
      .where({ id })
      .update({ is_verified: true });
    return trx('password_reset_otps').where({ id }).first();
  },

  findVerified: async (email, otp, trx = db) => {
    return trx('password_reset_otps')
      .where({ email, otp, is_verified: true })
      .where('expires_at', '>', trx.fn.now())
      .orderBy('created_at', 'desc')
      .first();
  },

  cleanup: async (email, trx = db) => {
    return trx('password_reset_otps')
      .where({ email })
      .delete();
  }
};

module.exports = otpModel;
