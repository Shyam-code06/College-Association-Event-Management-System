const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');

const productModel = {
  create: async (collegeId, productData, trx = db) => {
    const [id] = await trx('products').insert({
      college_id: collegeId,
      ...productData
    });
    return trx('products').where({ id, college_id: collegeId }).first();
  },

  findById: async (id, collegeId, trx = db) => {
    let query = trx('products').where('id', id);
    query = applyTenantScope(query, collegeId);
    return query.first();
  },

  findAll: async (collegeId, { isActive, search, offset = 0, limit = 10 }, trx = db) => {
    let query = trx('products');
    query = applyTenantScope(query, collegeId);

    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
    }

    if (search) {
      query = query.where((q) => {
        q.where('name', 'like', `%${search}%`).orWhere('description', 'like', `%${search}%`);
      });
    }

    return query.orderBy('created_at', 'desc').offset(offset).limit(limit);
  },

  count: async (collegeId, { isActive, search }, trx = db) => {
    let query = trx('products');
    query = applyTenantScope(query, collegeId);

    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
    }

    if (search) {
      query = query.where((q) => {
        q.where('name', 'like', `%${search}%`).orWhere('description', 'like', `%${search}%`);
      });
    }

    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  update: async (id, collegeId, updateData, trx = db) => {
    let query = trx('products').where('id', id);
    query = applyTenantScope(query, collegeId);
    await query.update(updateData);
    return trx('products').where({ id, college_id: collegeId }).first();
  },

  // --- Product Variants ---
  createVariant: async (collegeId, variantData, trx = db) => {
    const [id] = await trx('product_variants').insert({
      college_id: collegeId,
      ...variantData
    });
    return trx('product_variants').where({ id, college_id: collegeId }).first();
  },

  findVariantsByProductId: async (productId, collegeId, trx = db) => {
    let query = trx('product_variants').where('product_id', productId);
    query = applyTenantScope(query, collegeId);
    return query.orderBy('id', 'asc');
  },

  findVariantById: async (variantId, collegeId, trx = db) => {
    let query = trx('product_variants').where('id', variantId);
    query = applyTenantScope(query, collegeId);
    return query.first();
  },

  findVariantForUpdate: async (variantId, collegeId, trx) => {
    let query = trx('product_variants').where('id', variantId);
    query = applyTenantScope(query, collegeId);
    return query.forUpdate().first();
  },

  updateVariantStock: async (variantId, collegeId, newStock, trx = db) => {
    let query = trx('product_variants').where('id', variantId);
    query = applyTenantScope(query, collegeId);
    await query.update({ stock: newStock });
    return trx('product_variants').where({ id, college_id: collegeId }).first();
  },

  decrementVariantStock: async (variantId, collegeId, quantity, trx) => {
    let query = trx('product_variants').where('id', variantId);
    query = applyTenantScope(query, collegeId);
    await query.decrement('stock', quantity);
    return trx('product_variants').where({ id: variantId, college_id: collegeId }).first();
  },

  getInventorySummary: async (collegeId, trx = db) => {
    let query = trx('products')
      .select(
        'products.id as product_id',
        'products.name as product_name',
        'products.base_price',
        'product_variants.id as variant_id',
        'product_variants.size',
        'product_variants.stock'
      )
      .join('product_variants', 'products.id', 'product_variants.product_id');

    query = applyTenantScope(query, collegeId, 'products');
    return query.orderBy(['products.name', 'product_variants.size']);
  }
};

module.exports = productModel;
