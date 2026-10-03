const productsService = require('../services/products');
const { sendSuccess } = require('../utils/response');

const productsController = {
  create: async (req, res) => {
    const product = await productsService.createProductWithVariants(req.collegeId, req.body);
    return sendSuccess(res, 201, 'Product created successfully', product);
  },

  list: async (req, res) => {
    const result = await productsService.listProducts(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Products retrieved successfully', result.data, result.meta);
  },

  getById: async (req, res) => {
    const product = await productsService.getProductById(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'Product retrieved successfully', product);
  },

  update: async (req, res) => {
    const updated = await productsService.updateProduct(req.params.id, req.collegeId, req.body);
    return sendSuccess(res, 200, 'Product updated successfully', updated);
  },

  addVariant: async (req, res) => {
    const variant = await productsService.addVariant(req.params.id, req.collegeId, req.body);
    return sendSuccess(res, 201, 'Variant added successfully', variant);
  },

  updateVariantStock: async (req, res) => {
    const updated = await productsService.updateVariantStock(
      req.params.variantId,
      req.collegeId,
      req.body.stock
    );
    return sendSuccess(res, 200, 'Variant stock updated successfully', updated);
  },

  getInventory: async (req, res) => {
    const inventory = await productsService.getInventorySummary(req.collegeId);
    return sendSuccess(res, 200, 'Inventory summary retrieved successfully', inventory);
  }
};

module.exports = productsController;
