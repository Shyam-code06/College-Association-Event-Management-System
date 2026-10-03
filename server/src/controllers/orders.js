const ordersService = require('../services/orders');
const { sendSuccess } = require('../utils/response');

const ordersController = {
  create: async (req, res) => {
    const result = await ordersService.createOrder(req.user.id, req.collegeId, req.body);
    return sendSuccess(res, 201, 'Order placed successfully', result);
  },

  listAll: async (req, res) => {
    const result = await ordersService.listAllOrders(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Orders retrieved successfully', result.data, result.meta);
  },

  getStudentOrders: async (req, res) => {
    const result = await ordersService.getStudentOrders(req.user.id, req.collegeId, req.query);
    return sendSuccess(res, 200, 'Student orders retrieved successfully', result.data, result.meta);
  },

  getById: async (req, res) => {
    const order = await ordersService.getOrderById(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'Order retrieved successfully', order);
  }
};

module.exports = ordersController;
