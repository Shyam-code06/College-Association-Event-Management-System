const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');

const orderModel = {
  createOrder: async (collegeId, orderData, trx = db) => {
    const [id] = await trx('orders').insert({
      college_id: collegeId,
      ...orderData
    });
    return trx('orders').where({ id, college_id: collegeId }).first();
  },

  createOrderItem: async (collegeId, itemData, trx = db) => {
    const [id] = await trx('order_items').insert({
      college_id: collegeId,
      ...itemData
    });
    return trx('order_items').where({ id, college_id: collegeId }).first();
  },

  findOrderById: async (id, collegeId, trx = db) => {
    let query = trx('orders')
      .select('orders.*', 'users.name as user_name', 'users.email as user_email')
      .leftJoin('users', 'orders.user_id', 'users.id')
      .where('orders.id', id);

    query = applyTenantScope(query, collegeId, 'orders');
    return query.first();
  },

  findOrderItems: async (orderId, collegeId, trx = db) => {
    let query = trx('order_items')
      .select(
        'order_items.*',
        'products.name as product_name',
        'product_variants.size as variant_size'
      )
      .join('products', 'order_items.product_id', 'products.id')
      .join('product_variants', 'order_items.variant_id', 'product_variants.id')
      .where('order_items.order_id', orderId);

    query = applyTenantScope(query, collegeId, 'order_items');
    return query;
  },

  findAllOrders: async (collegeId, { status, offset = 0, limit = 10 }, trx = db) => {
    let query = trx('orders')
      .select('orders.*', 'users.name as user_name', 'users.email as user_email')
      .join('users', 'orders.user_id', 'users.id');

    query = applyTenantScope(query, collegeId, 'orders');

    if (status) {
      query = query.where('orders.status', status);
    }

    return query.orderBy('orders.created_at', 'desc').offset(offset).limit(limit);
  },

  countOrders: async (collegeId, { status }, trx = db) => {
    let query = trx('orders');
    query = applyTenantScope(query, collegeId);

    if (status) {
      query = query.where('status', status);
    }

    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  findStudentOrders: async (userId, collegeId, { offset = 0, limit = 10 }, trx = db) => {
    let query = trx('orders').where('user_id', userId);
    query = applyTenantScope(query, collegeId);
    return query.orderBy('created_at', 'desc').offset(offset).limit(limit);
  },

  countStudentOrders: async (userId, collegeId, trx = db) => {
    let query = trx('orders').where('user_id', userId);
    query = applyTenantScope(query, collegeId);
    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  updateOrderStatus: async (id, collegeId, status, trx = db) => {
    let query = trx('orders').where('id', id);
    query = applyTenantScope(query, collegeId);
    await query.update({ status });
    return trx('orders').where({ id, college_id: collegeId }).first();
  }
};

module.exports = orderModel;
