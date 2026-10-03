const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().allow(null, ''),
  base_price: Joi.number().min(0).precision(2).required(),
  variants: Joi.array()
    .items(
      Joi.object({
        size: Joi.string().trim().required(),
        stock: Joi.number().integer().min(0).default(0),
        stock_quantity: Joi.number().integer().min(0)
      }).unknown(true)
    )
    .default([])
}).unknown(true);

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  description: Joi.string().trim().allow(null, ''),
  base_price: Joi.number().min(0).precision(2),
  is_active: Joi.boolean()
}).min(1).unknown(true);

const addVariantSchema = Joi.object({
  size: Joi.string().trim().required(),
  stock: Joi.number().integer().min(0).default(0),
  stock_quantity: Joi.number().integer().min(0),
  price: Joi.number().min(0)
}).unknown(true);

const updateVariantStockSchema = Joi.object({
  stock: Joi.number().integer().min(0),
  stock_quantity: Joi.number().integer().min(0)
}).unknown(true);

const listProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  isActive: Joi.string().valid('true', 'false'),
  search: Joi.string().trim().allow('')
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  addVariantSchema,
  updateVariantStockSchema,
  listProductsSchema
};
