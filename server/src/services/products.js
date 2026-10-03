const productModel = require('../models/product');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const productsService = {
  /**
   * Creates a product with its size variants.
   *
   * @param {number} collegeId
   * @param {object} payload - { name, description, base_price, variants: [{ size, stock }] }
   */
  createProductWithVariants: async (collegeId, { name, description, base_price, variants = [] }) => {
    const product = await productModel.create(collegeId, {
      name,
      description,
      base_price: parseFloat(base_price)
    });

    const createdVariants = [];
    for (const v of variants) {
      const createdV = await productModel.createVariant(collegeId, {
        product_id: product.id,
        size: v.size,
        stock: parseInt(v.stock ?? v.stock_quantity, 10) || 0
      });
      createdVariants.push(createdV);
    }

    return {
      ...product,
      variants: createdVariants
    };
  },

  /**
   * Lists products for the college.
   */
  listProducts: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const filters = {
      isActive: queryParams.isActive !== undefined ? queryParams.isActive === 'true' : undefined,
      search: queryParams.search,
      offset,
      limit
    };

    const products = await productModel.findAll(collegeId, filters);
    const total = await productModel.count(collegeId, filters);

    // Attach variants to products
    const productsWithVariants = await Promise.all(
      products.map(async (prod) => {
        const variants = await productModel.findVariantsByProductId(prod.id, collegeId);
        const mappedVariants = (variants || []).map((v) => ({
          ...v,
          stock: v.stock ?? v.stock_quantity ?? 0,
          stock_quantity: v.stock ?? v.stock_quantity ?? 0
        }));
        return {
          ...prod,
          variants: mappedVariants
        };
      })
    );

    return {
      data: productsWithVariants,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Retrieves single product with variants.
   */
  getProductById: async (id, collegeId) => {
    const product = await productModel.findById(id, collegeId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const variants = await productModel.findVariantsByProductId(product.id, collegeId);
    const mappedVariants = (variants || []).map((v) => ({
      ...v,
      stock: v.stock ?? v.stock_quantity ?? 0,
      stock_quantity: v.stock ?? v.stock_quantity ?? 0
    }));
    return {
      ...product,
      variants: mappedVariants
    };
  },

  /**
   * Updates product details.
   */
  updateProduct: async (id, collegeId, updateData) => {
    const product = await productModel.findById(id, collegeId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return productModel.update(id, collegeId, updateData);
  },

  /**
   * Adds a variant to an existing product.
   */
  addVariant: async (productId, collegeId, { size, stock }) => {
    const product = await productModel.findById(productId, collegeId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return productModel.createVariant(collegeId, {
      product_id: productId,
      size,
      stock: parseInt(stock, 10) || 0
    });
  },

  /**
   * Updates stock of an existing variant.
   */
  updateVariantStock: async (variantId, collegeId, newStock) => {
    const variant = await productModel.findVariantById(variantId, collegeId);
    if (!variant) {
      throw new AppError('Product variant not found', 404);
    }

    return productModel.updateVariantStock(variantId, collegeId, parseInt(newStock, 10) || 0);
  },

  /**
   * Returns college inventory summary report.
   */
  getInventorySummary: async (collegeId) => {
    return productModel.getInventorySummary(collegeId);
  }
};

module.exports = productsService;
