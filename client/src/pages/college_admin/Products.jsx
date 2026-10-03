import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Layers } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { productsApi } from '@/api/products';
import { formatCurrency } from '@/utils/format';

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size'];

const DEFAULT_PRODUCT_VARIANTS = [
  { size: 'S', stock: '20' },
  { size: 'M', stock: '50' },
  { size: 'L', stock: '30' },
  { size: 'XL', stock: '15' },
];

export const AdminProducts = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // New Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [productVariants, setProductVariants] = useState(DEFAULT_PRODUCT_VARIANTS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Variant Modal State (supports multiple sizes at once)
  const [variantProduct, setVariantProduct] = useState(null);
  const [variantRows, setVariantRows] = useState([]);

  // Update Stock Modal State
  const [stockTarget, setStockTarget] = useState(null);
  const [newStock, setNewStock] = useState('');

  // ----------------------------------------------------
  // Product Creation Handlers
  // ----------------------------------------------------
  const handleOpenProductModal = () => {
    setName('');
    setDescription('');
    setBasePrice('');
    setProductVariants(DEFAULT_PRODUCT_VARIANTS);
    setIsProductModalOpen(true);
  };

  const handleAddProductVariantRow = (sizeName = '') => {
    setProductVariants((prev) => [...prev, { size: sizeName, stock: '25' }]);
  };

  const handleRemoveProductVariantRow = (index) => {
    setProductVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateProductVariantField = (index, field, value) => {
    setProductVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddPresetSizeToProduct = (preset) => {
    if (!productVariants.some((v) => v.size.toLowerCase() === preset.toLowerCase())) {
      setProductVariants((prev) => [...prev, { size: preset, stock: '25' }]);
    } else {
      toast.info(`Size ${preset} is already added.`);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validVariants = productVariants
        .filter((v) => v.size && v.size.trim().length > 0)
        .map((v) => ({
          size: v.size.trim(),
          stock: Math.max(0, parseInt(v.stock, 10) || 0),
        }));

      await productsApi.create({
        name: name.trim(),
        description: description?.trim() || '',
        base_price: Number(basePrice),
        variants: validVariants,
      });

      toast.success('Product created successfully with sizes!');
      setIsProductModalOpen(false);
      setName('');
      setDescription('');
      setBasePrice('');
      setProductVariants(DEFAULT_PRODUCT_VARIANTS);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Add Variant(s) to Existing Product Handlers
  // ----------------------------------------------------
  const handleOpenAddVariantModal = (product) => {
    setVariantProduct(product);
    const existingSizes = new Set((product.variants || []).map((v) => v.size?.toLowerCase()));
    const firstSuggested = COMMON_SIZES.find((s) => !existingSizes.has(s.toLowerCase())) || 'M';

    setVariantRows([
      {
        size: firstSuggested,
        stockQuantity: '50',
        price: product.base_price ? String(product.base_price) : '',
      },
    ]);
  };

  const handleAddVariantRow = (sizeName = '') => {
    setVariantRows((prev) => [
      ...prev,
      {
        size: sizeName,
        stockQuantity: '50',
        price: variantProduct?.base_price ? String(variantProduct.base_price) : '',
      },
    ]);
  };

  const handleRemoveVariantRow = (index) => {
    setVariantRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVariantRowField = (index, field, value) => {
    setVariantRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddPresetSizeToVariantModal = (preset) => {
    const alreadyInRows = variantRows.some((r) => r.size.toLowerCase() === preset.toLowerCase());
    const alreadyInProduct = (variantProduct?.variants || []).some(
      (v) => v.size?.toLowerCase() === preset.toLowerCase()
    );

    if (alreadyInRows) {
      toast.info(`Size ${preset} is already in the list.`);
      return;
    }
    if (alreadyInProduct) {
      toast.info(`Product already has size ${preset}. You can click it in the table to update stock.`);
    }

    setVariantRows((prev) => [
      ...prev,
      {
        size: preset,
        stockQuantity: '50',
        price: variantProduct?.base_price ? String(variantProduct.base_price) : '',
      },
    ]);
  };

  const handleAddVariantSubmit = async (e) => {
    e.preventDefault();
    if (!variantProduct) return;

    const validRows = variantRows.filter((r) => r.size && r.size.trim().length > 0);
    if (validRows.length === 0) {
      toast.error('Please specify at least one size.');
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.all(
        validRows.map((r) =>
          productsApi.addVariant(variantProduct.id, {
            size: r.size.trim(),
            stock_quantity: Math.max(0, parseInt(r.stockQuantity, 10) || 0),
            price: r.price ? Number(r.price) : variantProduct.base_price,
          })
        )
      );

      toast.success(
        validRows.length > 1
          ? `${validRows.length} sizes added successfully!`
          : 'Size added successfully!'
      );
      setVariantProduct(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to add size variants.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Update Stock Handler
  // ----------------------------------------------------
  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!stockTarget) return;
    setIsSubmitting(true);
    try {
      await productsApi.updateStock(stockTarget.id, {
        stock_quantity: Math.max(0, parseInt(newStock, 10) || 0),
      });
      toast.success('Stock updated successfully!');
      setStockTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to update stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Product Name',
      render: (row) => (
        <div>
          <span className="font-bold text-ink">{row.name}</span>
          <span className="block text-xs text-muted truncate max-w-xs">
            {row.description || 'No description provided'}
          </span>
        </div>
      ),
    },
    {
      key: 'base_price',
      header: 'Base Price',
      render: (row) => (
        <span className="font-semibold text-primary">
          {formatCurrency(row.base_price)}
        </span>
      ),
    },
    {
      key: 'variants',
      header: 'Sizes & Stock',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5 items-center">
          {row.variants && row.variants.length > 0 ? (
            row.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setStockTarget(v);
                  setNewStock(String(v.stock ?? v.stock_quantity ?? 0));
                }}
                className="px-2.5 py-1 rounded-md bg-canvas border border-line text-xs font-medium hover:border-primary hover:bg-primary-soft transition-colors cursor-pointer text-ink flex items-center gap-1.5"
                title="Click to update stock quantity"
              >
                <span className="font-bold text-primary">{v.size}:</span>
                <span>{v.stock ?? v.stock_quantity ?? 0}</span>
              </button>
            ))
          ) : (
            <span className="text-xs text-muted italic">No sizes yet</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenAddVariantModal(row)}
          icon={Plus}
        >
          Add Size
        </Button>
      ),
    },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Merchandise & Inventory"
        subtitle="Manage association hoodies, apparel lines, sizes, and stock availability"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Products', href: '/admin/products' },
        ]}
        api={productsApi.list}
        columns={columns}
        actionLabel="New Product"
        onAction={handleOpenProductModal}
        actionIcon={Plus}
        searchPlaceholder="Search merchandise..."
      />

      {/* New Product Modal (With Multiple Sizes & Stock directly) */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Add Merchandise Product"
        subtitle="Create a new merchandise item and specify all size variants and stock counts at once"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <FormField label="Product Name" required>
            <Input
              placeholder="e.g. Skyline Zip-up Campus Hoodie"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Base Price (INR ₹)" required>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 899"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              rows={2}
              placeholder="Material, GSM, print details, and sizing notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          {/* Sizes & Initial Stock Section */}
          <div className="pt-2 border-t border-line space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" /> Sizes & Initial Stock
                </h4>
                <p className="text-[11px] text-muted">
                  Add one or more sizes with starting stock quantities
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddProductVariantRow('')}
                icon={Plus}
              >
                Add Size
              </Button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-canvas/70 rounded-md border border-line">
              <span className="text-xs text-muted font-medium mr-1">Quick Add:</span>
              {COMMON_SIZES.map((sz) => {
                const isAdded = productVariants.some(
                  (v) => v.size.toLowerCase() === sz.toLowerCase()
                );
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleAddPresetSizeToProduct(sz)}
                    className={`px-2 py-0.5 text-xs rounded transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-primary-soft text-primary font-medium border border-primary/30'
                        : 'bg-surface border border-line text-ink hover:border-primary hover:text-primary'
                    }`}
                    title={isAdded ? `Size ${sz} is added` : `Add size ${sz}`}
                  >
                    {isAdded ? `✓ ${sz}` : `+ ${sz}`}
                  </button>
                );
              })}
            </div>

            {/* Size Variants Table / Rows */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {productVariants.length > 0 ? (
                productVariants.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-surface rounded-md border border-line shadow-xs"
                  >
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-bold text-muted mb-0.5">
                        Size / Label *
                      </label>
                      <Input
                        placeholder="e.g. S, M, XL, 32"
                        value={item.size}
                        onChange={(e) =>
                          handleUpdateProductVariantField(idx, 'size', e.target.value)
                        }
                        required
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-[10px] uppercase font-bold text-muted mb-0.5">
                        Stock Qty *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="50"
                        value={item.stock}
                        onChange={(e) =>
                          handleUpdateProductVariantField(idx, 'stock', e.target.value)
                        }
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveProductVariantRow(idx)}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer"
                        title="Remove size"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 px-2 border border-dashed border-line rounded-md bg-canvas/40">
                  <p className="text-xs text-muted">
                    No sizes added yet. Use the quick presets above or click &ldquo;Add Size&rdquo;.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProductModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Variant(s) Modal for Existing Product */}
      <Modal
        isOpen={Boolean(variantProduct)}
        onClose={() => setVariantProduct(null)}
        title={`Add Sizes for ${variantProduct?.name}`}
        subtitle="Add one or multiple size variants with stock quantity"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddVariantSubmit} className="space-y-4">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-canvas/70 rounded-md border border-line">
            <span className="text-xs text-muted font-medium mr-1">Quick Add:</span>
            {COMMON_SIZES.map((sz) => {
              const alreadyInRows = variantRows.some(
                (r) => r.size.toLowerCase() === sz.toLowerCase()
              );
              const alreadyInProduct = (variantProduct?.variants || []).some(
                (v) => v.size?.toLowerCase() === sz.toLowerCase()
              );
              const isSelected = alreadyInRows || alreadyInProduct;

              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleAddPresetSizeToVariantModal(sz)}
                  className={`px-2 py-0.5 text-xs rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-soft text-primary font-medium border border-primary/30'
                      : 'bg-surface border border-line text-ink hover:border-primary hover:text-primary'
                  }`}
                  title={alreadyInProduct ? `Size ${sz} already exists` : `Add size ${sz}`}
                >
                  {alreadyInProduct ? `✓ ${sz} (in store)` : alreadyInRows ? `✓ ${sz}` : `+ ${sz}`}
                </button>
              );
            })}
          </div>

          {/* Multiple Variant Rows */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {variantRows.map((row, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-surface rounded-md border border-line shadow-xs"
              >
                <div className="flex-1">
                  <label className="block text-[10px] uppercase font-bold text-muted mb-0.5">
                    Size / Label *
                  </label>
                  <Input
                    placeholder="e.g. S, M, XL"
                    value={row.size}
                    onChange={(e) =>
                      handleUpdateVariantRowField(idx, 'size', e.target.value)
                    }
                    required
                    className="h-8 text-xs font-semibold"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-[10px] uppercase font-bold text-muted mb-0.5">
                    Stock Qty *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={row.stockQuantity}
                    onChange={(e) =>
                      handleUpdateVariantRowField(idx, 'stockQuantity', e.target.value)
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-[10px] uppercase font-bold text-muted mb-0.5">
                    Price (₹)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={String(variantProduct?.base_price || '')}
                    value={row.price}
                    onChange={(e) =>
                      handleUpdateVariantRowField(idx, 'price', e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveVariantRow(idx)}
                    disabled={variantRows.length === 1}
                    className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove size row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddVariantRow('')}
              icon={Plus}
            >
              Add Another Size
            </Button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVariantProduct(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {variantRows.length > 1 ? `Add ${variantRows.length} Sizes` : 'Add Size'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Stock Modal */}
      <Modal
        isOpen={Boolean(stockTarget)}
        onClose={() => setStockTarget(null)}
        title={`Update Stock: Size ${stockTarget?.size}`}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleUpdateStock} className="space-y-4">
          <FormField label="Current Stock Units" required>
            <Input
              type="number"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              required
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStockTarget(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Stock
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AdminProducts;
