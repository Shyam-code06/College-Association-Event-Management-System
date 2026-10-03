const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user');
const collegeModel = require('../models/college');
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
      message: 'Registration submitted successfully! Your account is pending approval from your College Administrator.',
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
          'Your student account is pending approval from your College Administrator. An approval request has been sent. Once approved, you can access your student dashboard.',
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
  }
};

module.exports = authService;
