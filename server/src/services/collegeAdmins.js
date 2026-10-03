const bcrypt = require('bcrypt');
const db = require('../config/database');
const userModel = require('../models/user');
const collegeModel = require('../models/college');
const financeModel = require('../models/finance');
const productModel = require('../models/product');
const { ROLES } = require('../constants/roles');
const { FINANCE_TYPE } = require('../constants/statuses');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const DEFAULT_FINANCE_CATEGORIES = [
  { name: 'Membership Dues', type: FINANCE_TYPE.INCOME },
  { name: 'Ticket Sales', type: FINANCE_TYPE.INCOME },
  { name: 'Merchandise Sales', type: FINANCE_TYPE.INCOME },
  { name: 'Fundraiser', type: FINANCE_TYPE.INCOME },
  { name: 'Sponsorship', type: FINANCE_TYPE.INCOME },
  { name: 'Donation', type: FINANCE_TYPE.INCOME },
  { name: 'Other Income', type: FINANCE_TYPE.INCOME },
  { name: 'Volunteer Reimbursement', type: FINANCE_TYPE.EXPENSE },
  { name: 'Event Logistics', type: FINANCE_TYPE.EXPENSE },
  { name: 'Merchandise Production', type: FINANCE_TYPE.EXPENSE },
  { name: 'Marketing', type: FINANCE_TYPE.EXPENSE },
  { name: 'Venue Rental', type: FINANCE_TYPE.EXPENSE },
  { name: 'Equipment', type: FINANCE_TYPE.EXPENSE },
  { name: 'Other Expense', type: FINANCE_TYPE.EXPENSE }
];

const collegeAdminsService = {
  /**
   * Creates a College Admin and associated College in a single atomic transaction.
   * Also seeds standard finance categories for the new college.
   *
   * @param {number} superAdminId
   * @param {object} payload
   */
  createCollegeAdminWithCollege: async (superAdminId, { collegeId, collegeName, collegeCode, collegeDomain, adminName, adminEmail, adminPassword }) => {
    return db.transaction(async (trx) => {
      // 1. Check unique email for administrator
      const existingUser = await userModel.findByEmail(adminEmail, trx);
      if (existingUser) {
        throw new AppError('A user with this email address already exists', 409);
      }

      let college;
      if (collegeId) {
        college = await collegeModel.findById(collegeId, trx);
        if (!college) {
          throw new AppError('Selected college institution does not exist', 404);
        }
      } else {
        // Auto-generate code from college name if not provided
        let finalCode = (collegeCode || '').trim().toUpperCase();
        if (!finalCode) {
          const cleaned = collegeName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
          const words = cleaned.split(/\s+/).filter(Boolean);
          if (words.length > 1) {
            finalCode = words.map((w) => w[0]).join('').toUpperCase();
          }
          if (finalCode.length < 2) {
            finalCode = cleaned.slice(0, 4).toUpperCase();
          }
          if (!finalCode) finalCode = 'CAMPUS';
        }

        // Ensure unique code
        let uniqueCode = finalCode;
        let suffix = 2;
        while (await collegeModel.findByNameOrCode('', uniqueCode, trx)) {
          uniqueCode = `${finalCode}${suffix}`;
          suffix++;
        }

        // Check unique college name
        const existingCollege = await collegeModel.findByNameOrCode(collegeName, uniqueCode, trx);
        if (existingCollege && existingCollege.name.toLowerCase() === collegeName.toLowerCase()) {
          throw new AppError('A college with this name already exists', 409);
        }

        // Determine official institutional email domain (e.g. ldce.ac.in)
        let finalDomain = collegeDomain ? collegeDomain.trim().toLowerCase().replace(/^@/, '') : null;
        if (!finalDomain && adminEmail) {
          const emailParts = adminEmail.split('@')[1]?.toLowerCase().trim();
          if (emailParts && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(emailParts)) {
            finalDomain = emailParts;
          }
        }

        // Create New College with domain
        college = await collegeModel.create(
          {
            name: collegeName.trim(),
            code: uniqueCode,
            domain: finalDomain,
            is_active: true
          },
          trx
        );

        // Seed initial finance categories for this new college
        for (const cat of DEFAULT_FINANCE_CATEGORIES) {
          await financeModel.createCategory(college.id, cat, trx);
        }

        // Seed initial default merchandise products
        const defaultTshirt = await productModel.create(
          college.id,
          {
            name: `${college.name} Official Campus T-Shirt`,
            description: '100% premium bio-wash cotton association edition t-shirt',
            base_price: 399.00,
            is_active: true
          },
          trx
        );
        for (const sz of ['S', 'M', 'L', 'XL']) {
          await productModel.createVariant(college.id, { product_id: defaultTshirt.id, size: sz, stock: 30 }, trx);
        }
      }

      // 4. Create College Admin
      const password_hash = await bcrypt.hash(adminPassword, 10);
      const admin = await userModel.create(
        {
          college_id: college.id,
          name: adminName,
          email: adminEmail,
          password_hash,
          role: ROLES.COLLEGE_ADMIN,
          created_by: superAdminId,
          is_active: true
        },
        trx
      );

      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: Boolean(admin.is_active),
        createdAt: admin.created_at,
        college: {
          id: college.id,
          name: college.name,
          code: college.code,
          isActive: Boolean(college.is_active)
        }
      };
    });
  },

  /**
   * Lists all College Admins with college information.
   *
   * @param {object} queryParams
   */
  listCollegeAdmins: async (queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const filters = {
      search: queryParams.search,
      isActive: queryParams.isActive !== undefined ? queryParams.isActive === 'true' : undefined,
      offset,
      limit
    };

    const admins = await userModel.findAllCollegeAdmins(filters);
    const total = await userModel.countCollegeAdmins(filters);

    const formatted = admins.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      isActive: Boolean(a.is_active),
      createdAt: a.created_at,
      deletedAt: a.deleted_at,
      college: {
        id: a.college_id,
        name: a.college_name,
        code: a.college_code,
        isActive: Boolean(a.college_is_active)
      }
    }));

    return {
      data: formatted,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Retrieves single College Admin by ID with college details.
   *
   * @param {number} id
   */
  getCollegeAdminById: async (id) => {
    const user = await userModel.findById(id);
    if (!user || user.role !== ROLES.COLLEGE_ADMIN) {
      throw new AppError('College administrator not found', 404);
    }

    const college = await collegeModel.findById(user.college_id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: Boolean(user.is_active),
      createdAt: user.created_at,
      deletedAt: user.deleted_at,
      college: college ? {
        id: college.id,
        name: college.name,
        code: college.code,
        isActive: Boolean(college.is_active)
      } : null
    };
  },

  /**
   * Toggles access (activate/deactivate) for a College Admin and their associated college.
   *
   * @param {number} id
   * @param {boolean} isActive
   */
  toggleAccess: async (id, isActive) => {
    return db.transaction(async (trx) => {
      const user = await userModel.findById(id, null, trx);
      if (!user || user.role !== ROLES.COLLEGE_ADMIN) {
        throw new AppError('College administrator not found', 404);
      }

      if (user.deleted_at !== null) {
        throw new AppError('Cannot modify access of a deleted administrator', 400);
      }

      const targetStatus = isActive !== undefined ? Boolean(isActive) : !user.is_active;

      // Update College Admin
      const updatedAdmin = await userModel.update(id, { is_active: targetStatus }, null, trx);

      // Update College (revoking access deactivates college, reactivating restores)
      const updatedCollege = await collegeModel.update(user.college_id, { is_active: targetStatus }, trx);

      return {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        isActive: Boolean(updatedAdmin.is_active),
        college: {
          id: updatedCollege.id,
          name: updatedCollege.name,
          isActive: Boolean(updatedCollege.is_active)
        }
      };
    });
  },

  /**
   * Soft deletes a College Admin and disables the college.
   *
   * @param {number} id
   */
  softDeleteCollegeAdmin: async (id) => {
    return db.transaction(async (trx) => {
      const user = await userModel.findById(id, null, trx);
      if (!user || user.role !== ROLES.COLLEGE_ADMIN) {
        throw new AppError('College administrator not found', 404);
      }

      if (user.deleted_at !== null) {
        throw new AppError('College administrator is already deleted', 400);
      }

      // Soft delete admin
      const deletedAdmin = await userModel.softDelete(id, null, trx);

      // Soft delete/disable college
      await collegeModel.softDelete(user.college_id, trx);

      return {
        id: deletedAdmin.id,
        name: deletedAdmin.name,
        email: deletedAdmin.email,
        isDeleted: true
      };
    });
  }
};

module.exports = collegeAdminsService;
