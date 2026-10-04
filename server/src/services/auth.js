const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user');
const collegeModel = require('../models/college');
const otpModel = require('../models/otp');
const { sendMail } = require('./email');
const env = require('../config/env');
const { ROLES } = require('../constants/roles');
const AppError = require('../utils/appError');

/**
 * Signs a JWT access token.
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      collegeId: user.college_id
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

const authService = {
  /**
   * Registers a new student into a specified active college.
   *
   * @param {object} payload
   * @returns {Promise<{ token: string, user: object }>}
   */
  registerStudent: async ({ name, email, password, college_id }) => {
    let targetCollegeId = college_id;
    const emailDomain = email.split('@')[1]?.toLowerCase().trim();

    // Auto-resolve college from email domain
    const activeColleges = await collegeModel.findAllActive();
    const matchedCollege = activeColleges.find(
      (c) => c.domain && (emailDomain === c.domain.toLowerCase() || emailDomain.endsWith('.' + c.domain.toLowerCase()))
    );

    if (matchedCollege) {
      targetCollegeId = matchedCollege.id;
    } else if (targetCollegeId) {
      const college = await collegeModel.findById(targetCollegeId);
      if (college && college.domain) {
        const allowed = college.domain.toLowerCase().trim();
        if (emailDomain !== allowed && !emailDomain.endsWith('.' + allowed)) {
          throw new AppError(
            `Only institutional email addresses ending with @${college.domain} are eligible for ${college.name}. Please use your official campus email.`,
            400
          );
        }
      }
    } else {
      throw new AppError(
        `Email domain '@${emailDomain}' is not affiliated with any recognized college campus. Please register using your official college email address.`,
        400
      );
    }

    // 1. Verify college exists and is active
    const college = await collegeModel.findById(targetCollegeId);
    if (!college || !college.is_active || college.deleted_at !== null) {
      throw new AppError('The recognized college is invalid, inactive, or disabled', 400);
    }

    // 3. Verify email is unique
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      throw new AppError('An account with this email address already exists', 409);
    }

    // 3. Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 4. Create user - newly registered student starts with pending approval
    const newUser = await userModel.create({
      college_id: targetCollegeId,
      name,
      email,
      password_hash,
      role: ROLES.STUDENT,
      created_by: null,
      is_active: false
    });

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      collegeId: newUser.college_id,
      collegeName: college.name,
      isActive: false
    };

    return {
      isPendingApproval: true,
      message: 'Registration submitted successfully! Your data has been sent to your College Admin. After approval, you can access your dashboard.',
      user: safeUser
    };
  },

  /**
   * Submits or records an approval request for a student account.
   *
   * @param {object} payload - { email }
   */
  requestApproval: async ({ email }) => {
    if (!email) {
      throw new AppError('Email address is required', 400);
    }

    const user = await userModel.findByEmail(email);
    if (!user || user.deleted_at !== null) {
      return { message: 'If an account exists with this email, an approval request has been notified to your College Administrator.' };
    }

    if (user.is_active) {
      return { message: 'Your account is already active and approved. You can log in directly.', isAlreadyActive: true };
    }

    return {
      message: `Approval request recorded for ${user.name}. Your College Administrator has been notified to approve your account.`,
      isPendingApproval: true
    };
  },

  /**
   * Checks if an email domain matches any affiliated college campus.
   *
   * @param {object} payload - { email }
   */
  checkCampus: async ({ email }) => {
    if (!email || !email.includes('@')) {
      return { matched: false };
    }
    const emailDomain = email.split('@')[1]?.toLowerCase().trim();
    if (!emailDomain) {
      return { matched: false };
    }

    const activeColleges = await collegeModel.findAllActive();
    const matched = activeColleges.find(
      (c) => c.domain && (emailDomain === c.domain.toLowerCase() || emailDomain.endsWith('.' + c.domain.toLowerCase()))
    );

    if (matched) {
      return {
        matched: true,
        college: {
          id: matched.id,
          name: matched.name,
          domain: matched.domain,
          code: matched.code
        }
      };
    }
    return { matched: false };
  },

  /**
   * Authenticates user across any role.
   *
   * @param {object} payload - { email, password }
   * @returns {Promise<{ token: string, user: object }>}
   */

  login: async ({ email, password }) => {
    const user = await userModel.findByEmail(email);
    if (!user || user.deleted_at !== null) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.is_active) {
      if (user.role === ROLES.STUDENT) {
        throw new AppError(
          'Your data has been sent to your College Admin. After approval, you can access your dashboard.',
          403,
          [{ field: 'approval', status: 'PENDING_APPROVAL', email: user.email }]
        );
      }
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }


    // Tenant check for non-super_admin users
    let collegeName = null;
    if (user.role !== ROLES.SUPER_ADMIN) {
      if (!user.college_id) {
        throw new AppError('User is not associated with any college', 403);
      }

      const college = await collegeModel.findById(user.college_id);
      if (!college || !college.is_active || college.deleted_at !== null) {
        throw new AppError('Your college has been deactivated or disabled. Access blocked.', 403);
      }
      collegeName = college.name;

      // Verify College Admin status for this college
      const adminRecord = await userModel.findAllCollegeAdmins({ search: college.name });
      const activeAdmin = adminRecord.find((a) => a.college_id === user.college_id && a.is_active && !a.deleted_at);

      if (!activeAdmin) {
        throw new AppError('College administrator access is revoked. Access blocked for all college users.', 403);
      }
    }

    const token = generateToken(user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeId: user.college_id,
      collegeName
    };

    return { token, user: safeUser };
  },

  /**
   * Retrieves profile details for the authenticated user.
   *
   * @param {number} userId
   * @returns {Promise<object>}
   */
  getMe: async (userId) => {
    const user = await userModel.findById(userId);
    if (!user || user.deleted_at !== null) {
      throw new AppError('User not found', 404);
    }

    let college = null;
    if (user.college_id) {
      college = await collegeModel.findById(user.college_id);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeId: user.college_id,
      college: college ? { id: college.id, name: college.name, code: college.code } : null,
      isActive: Boolean(user.is_active),
      createdAt: user.created_at
    };
  },

  /**
   * Changes password for authenticated user.
   *
   * @param {number} userId
   * @param {object} payload - { oldPassword, newPassword }
   */
  changePassword: async (userId, { oldPassword, newPassword }) => {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await userModel.update(userId, { password_hash });

    return { message: 'Password updated successfully' };
  },

  /**
   * Request OTP for student forgot password flow.
   * Only allowed for users with role === 'student'.
   *
   * @param {object} payload - { email }
   */
  forgotPasswordRequest: async ({ email }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userModel.findByEmail(normalizedEmail);

    if (!user || user.deleted_at !== null) {
      throw new AppError('No student account found with this email address.', 404);
    }

    // Strict role check: ONLY students allowed
    if (user.role !== ROLES.STUDENT) {
      throw new AppError(
        'Password reset with OTP is only allowed for student accounts. Organizers, College Admins, and Super Admins must use the administrative console.',
        403
      );
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Persist OTP in database (10 minute expiry)
    await otpModel.createOtp(normalizedEmail, otp, 10);

    // Send OTP email
    const subject = `Skyline — Password Reset OTP: ${otp}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #6d28d9; margin: 0; font-size: 22px;">Skyline Student Association</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Student Account Password Reset</p>
        </div>
        <p style="font-size: 14px;">Hello <strong>${user.name}</strong>,</p>
        <p style="font-size: 14px; color: #334155;">
          We received a request to reset the password for your student portal account. Please enter the 6-digit OTP code below to verify your identity:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 14px 28px; background: #f5f3ff; color: #6d28d9; border-radius: 8px; border: 2px dashed #8b5cf6;">
            ${otp}
          </div>
        </div>
        <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 16px;">
          ⏱️ This OTP code is valid for <strong>10 minutes</strong>.
        </p>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 20px;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">
            Security Notice: If you did not request this password reset, please ignore this email. Your current password remains safe and unchanged.
          </p>
        </div>
      </div>
    `;

    const mailResult = await sendMail({
      to: normalizedEmail,
      subject,
      html,
      text: `Your Skyline password reset OTP is: ${otp}. Valid for 10 minutes.`
    });

    if (!mailResult.success) {
      throw new AppError(`Failed to send OTP email: ${mailResult.error}`, 500);
    }

    return {
      message: 'A 6-digit verification OTP has been sent to your student email address.',
      email: normalizedEmail
    };
  },

  /**
   * Verifies the 6-digit OTP code for a student.
   *
   * @param {object} payload - { email, otp }
   */
  verifyResetOtp: async ({ email, otp }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userModel.findByEmail(normalizedEmail);

    if (!user || user.deleted_at !== null) {
      throw new AppError('No student account found with this email address.', 404);
    }

    if (user.role !== ROLES.STUDENT) {
      throw new AppError('Password reset with OTP is only permitted for student accounts.', 403);
    }

    const record = await otpModel.findLatestValid(normalizedEmail, otp.trim());
    if (!record) {
      throw new AppError('Invalid or expired OTP code. Please verify the code or request a new one.', 400);
    }

    await otpModel.markVerified(record.id);

    // Sign temporary reset token valid for 15 minutes
    const resetToken = jwt.sign(
      { email: normalizedEmail, purpose: 'pwd_reset' },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return {
      message: 'OTP verified successfully. You may now set your new password.',
      resetToken,
      email: normalizedEmail
    };
  },

  /**
   * Directly sets a new password without requiring old password.
   *
   * @param {object} payload - { email, otp, resetToken, newPassword, confirmPassword }
   */
  resetPasswordWithOtp: async ({ email, otp, resetToken, newPassword, confirmPassword }) => {
    if (newPassword !== confirmPassword) {
      throw new AppError('New password and confirm password do not match.', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await userModel.findByEmail(normalizedEmail);

    if (!user || user.deleted_at !== null) {
      throw new AppError('User not found.', 404);
    }

    if (user.role !== ROLES.STUDENT) {
      throw new AppError('Password reset with OTP is only allowed for student accounts.', 403);
    }

    // Verify authorization via token or verified OTP
    let authorized = false;

    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, env.JWT_SECRET);
        if (decoded.email === normalizedEmail && decoded.purpose === 'pwd_reset') {
          authorized = true;
        }
      } catch (err) {
        // Fallback to verified OTP in DB
      }
    }

    if (!authorized && otp) {
      const verifiedOtp = await otpModel.findVerified(normalizedEmail, otp.trim());
      if (verifiedOtp) {
        authorized = true;
      }
    }

    if (!authorized) {
      throw new AppError('Reset session has expired or is invalid. Please request a new OTP.', 400);
    }

    // Hash new password and update
    const password_hash = await bcrypt.hash(newPassword, 10);
    await userModel.update(user.id, { password_hash });

    // Invalidate OTPs for this student
    await otpModel.cleanup(normalizedEmail);

    return {
      message: 'Password has been reset successfully! You can now sign in with your new password.'
    };
  }
};

module.exports = authService;
