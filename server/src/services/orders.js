const db = require('../config/database');
const productModel = require('../models/product');
const orderModel = require('../models/order');
const paymentModel = require('../models/payment');
const membershipModel = require('../models/membership');
const { generateTransactionRef } = require('./mockPayment');
const { ORDER_STATUS, PAYMENT_STATUS, PAYABLE_TYPE } = require('../constants/statuses');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const ordersService = {
  /**
   * Places an order for merchandise with stock locking and member discount snapshot.
   *
   * @param {number} userId
   * @param {number} collegeId
   * @param {object} payload - { variantId, quantity }
   */
  createOrder: async (userId, collegeId, { variantId, quantity }) => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    return db.transaction(async (trx) => {
      // 1. Lock the variant row to prevent race conditions on stock
      const variant = await productModel.findVariantForUpdate(variantId, collegeId, trx);
      if (!variant) {
        throw new AppError('Product variant not found', 404);
      }

      if (variant.stock < qty) {
        throw new AppError(
          `Insufficient stock available. Only ${variant.stock} units remaining.`,
          400
        );
      }

      const product = await productModel.findById(variant.product_id, collegeId, trx);
      if (!product || !product.is_active) {
        throw new AppError('This product is no longer active for purchase', 400);
      }

      // 2. Decrement stock atomically
      await productModel.decrementVariantStock(variantId, collegeId, qty, trx);

      // 3. Check for active membership to apply discount
      const activeMembership = await membershipModel.getActiveMembership(userId, collegeId, trx);
      const discountPercent = activeMembership
        ? parseFloat(activeMembership.merch_discount_percent || 0)
        : 0;

      const unitPrice = parseFloat(product.base_price);
      const rawTotal = unitPrice * qty;
      const discountApplied = parseFloat(((rawTotal * discountPercent) / 100).toFixed(2));
      const finalPrice = parseFloat((rawTotal - discountApplied).toFixed(2));

      // 4. Create Order
      const order = await orderModel.createOrder(
        collegeId,
        {
          user_id: userId,
          total_amount: finalPrice,
          status: ORDER_STATUS.PENDING
        },
        trx
      );

      // 5. Create Order Item snapshot
      const orderItem = await orderModel.createOrderItem(
        collegeId,
        {
          order_id: order.id,
          product_id: product.id,
          variant_id: variant.id,
          quantity: qty,
          unit_price: unitPrice,
          discount_applied: discountApplied,
          final_price: finalPrice
        },
        trx
      );

      // 6. Create Payment Record
      const payment = await paymentModel.create(
        collegeId,
        {
          user_id: userId,
          payable_type: PAYABLE_TYPE.ORDER,
          payable_id: order.id,
          amount: finalPrice,
          status: PAYMENT_STATUS.PENDING,
          transaction_ref: generateTransactionRef()
        },
        trx
      );

      return {
        order,
        orderItem,
        payment
      };
    });
  },

  /**
   * Lists all orders for College Admin.
   */
  listAllOrders: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const orders = await orderModel.findAllOrders(collegeId, {
      status: queryParams.status,
      offset,
      limit
    });
    const total = await orderModel.countOrders(collegeId, { status: queryParams.status });

    const ordersWithItems = await Promise.all(
      orders.map(async (ord) => {
        const items = await orderModel.findOrderItems(ord.id, collegeId);
        return {
          ...ord,
          items
        };
      })
    );

    return {
      data: ordersWithItems,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Lists student's personal orders.
   */
  getStudentOrders: async (userId, collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const orders = await orderModel.findStudentOrders(userId, collegeId, { offset, limit });
    const total = await orderModel.countStudentOrders(userId, collegeId);

    const ordersWithItems = await Promise.all(
      orders.map(async (ord) => {
        const items = await orderModel.findOrderItems(ord.id, collegeId);
        return {
          ...ord,
          items
        };
      })
    );

    return {
      data: ordersWithItems,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Retrieves single order by ID with items.
   */
  getOrderById: async (id, collegeId) => {
    const order = await orderModel.findOrderById(id, collegeId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const items = await orderModel.findOrderItems(order.id, collegeId);
    return {
      ...order,
      items
    };
  }
};

module.exports = ordersService;
