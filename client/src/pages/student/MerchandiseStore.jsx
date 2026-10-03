import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ShoppingBag,
  Package,
  Award,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Wizard } from '@/components/ui/Wizard';
import { createWizardStore } from '@/stores/wizard';
import { productsApi } from '@/api/products';
import { membershipsApi } from '@/api/memberships';
import { ordersApi } from '@/api/orders';
import { paymentsApi } from '@/api/payments';
import { formatCurrency } from '@/utils/format';

// Step 1: Product Step
const ProductStep = ({ formData }) => {
  const product = formData.product || {};
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-md bg-canvas border border-line space-y-2">
        <h3 className="font-bold text-base text-ink">{product.name}</h3>
        <p className="text-xs text-muted leading-relaxed">{product.description}</p>
        <div className="flex items-center justify-between pt-2 border-t border-line text-xs">
          <span className="text-muted">Base Price</span>
          <span className="font-bold text-ink text-sm">
            {formatCurrency(product.base_price || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Step 2: Size & Quantity Step
const sizeQuantitySchema = z.object({
  variantId: z.string().min(1, 'Please select a size / variant'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').max(10, 'Max 10 per order'),
});

const SizeQuantityStep = ({ formData, updateFormData, errors }) => {
  const product = formData.product || {};
  const variants = product.variants || [];

  return (
    <div className="space-y-4">
      <FormField label="Select Size / Variant" required error={errors.variantId}>
        <Select
          value={formData.variantId || ''}
          onChange={(e) => {
            const v = variants.find((item) => String(item.id) === e.target.value);
            updateFormData({
              variantId: e.target.value,
              selectedVariant: v,
            });
          }}
        >
          <option value="">-- Choose variant --</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id} disabled={v.stock_quantity <= 0}>
              {v.size || v.name} {v.stock_quantity <= 0 ? '(Out of stock)' : `(${v.stock_quantity} left)`}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Quantity" required error={errors.quantity}>
        <Input
          type="number"
          min="1"
          max="10"
          value={formData.quantity || 1}
          onChange={(e) => updateFormData({ quantity: Number(e.target.value) })}
        />
      </FormField>
    </div>
  );
};

// Step 3: Review with Member Discount
const ReviewOrderStep = ({ formData }) => {
  const product = formData.product || {};
  const variant = formData.selectedVariant || {};
  const quantity = Number(formData.quantity) || 1;
  const unitPrice = Number(variant.price || product.base_price || 0);
  const subtotal = unitPrice * quantity;
  const discountPercent = formData.discountPercent || 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

  return (
    <div className="space-y-4 text-sm">
      <div className="p-4 rounded-md bg-canvas border border-line space-y-2">
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Item</span>
          <span className="font-semibold text-ink">
            {product.name} ({variant.size || 'Standard'})
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Quantity</span>
          <span className="font-semibold text-ink">{quantity}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-line">
          <span className="text-muted">Subtotal</span>
          <span className="text-ink">{formatCurrency(subtotal)}</span>
        </div>
        {discountPercent > 0 && (
          <div className="flex justify-between py-1 border-b border-line text-secondary">
            <span>Member Discount ({discountPercent}%)</span>
            <span>- {formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between py-2 text-base font-bold text-ink">
          <span>Total Payable</span>
          <span className="text-primary font-extrabold">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};

// Step 4: Payment Step
const PaymentOrderStep = ({ _formData }) => {
  return (
    <div className="space-y-4 text-center py-2">
      <div className="h-12 w-12 rounded-pill bg-primary-soft text-primary flex items-center justify-center mx-auto mb-2">
        <CreditCard className="h-6 w-6" />
      </div>
      <h4 className="font-bold text-base text-ink">Order Payment</h4>
      <p className="text-xs text-muted max-w-sm mx-auto">
        Simulated digital settlement for your official association merchandise order.
      </p>
    </div>
  );
};

// Step 5: Done Step
const DoneOrderStep = () => (
  <div className="text-center py-6">
    <div className="h-16 w-16 rounded-pill bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
      <CheckCircle2 className="h-10 w-10" />
    </div>
    <h3 className="text-xl font-bold text-ink mb-1">Order Placed Successfully!</h3>
    <p className="text-sm text-muted max-w-sm mx-auto">
      Your merchandise order is being processed by the association council. You can track pickup instructions in My Orders.
    </p>
  </div>
);

export const MerchandiseStore = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    Promise.allSettled([
      productsApi.list(),
      membershipsApi.getMyMembership(),
    ]).then(([prodRes, memRes]) => {
      if (prodRes.status === 'fulfilled') {
        setProducts(prodRes.value?.data || []);
      }
      if (memRes.status === 'fulfilled' && memRes.value?.data?.status === 'ACTIVE') {
        setDiscountPercent(memRes.value.data.merch_discount_percent || 10);
      }
      setLoading(false);
    });
  }, []);

  const wizardStore = useMemo(
    () =>
      createWizardStore({
        product: null,
        variantId: '',
        selectedVariant: null,
        quantity: 1,
        discountPercent: 0,
      }),
    []
  );

  const startOrder = (product) => {
    setSelectedProduct(product);
    wizardStore.getState().reset();
    wizardStore.getState().updateFormData({
      product,
      discountPercent,
      variantId: product.variants?.[0]?.id ? String(product.variants[0].id) : '',
      selectedVariant: product.variants?.[0] || null,
      quantity: 1,
    });
  };

  const steps = [
    {
      id: 'product',
      title: 'Merchandise Item',
      subtitle: selectedProduct?.name,
      component: ProductStep,
    },
    {
      id: 'variant',
      title: 'Size & Quantity',
      subtitle: 'Pick variant and number of units',
      schema: sizeQuantitySchema,
      component: SizeQuantityStep,
    },
    {
      id: 'review',
      title: 'Review with Member Discount',
      subtitle: 'Summary of merchandise order and discounts',
      component: ReviewOrderStep,
    },
    {
      id: 'payment',
      title: 'Payment Authorization',
      subtitle: 'Direct digital clearance',
      component: PaymentOrderStep,
    },
    {
      id: 'done',
      title: 'Order Confirmed',
      subtitle: '',
      component: DoneOrderStep,
    },
  ];

  const handleSubmit = async (formData) => {
    try {
      const orderRes = await ordersApi.create({
        variantId: Number(formData.variantId),
        quantity: Number(formData.quantity),
      });

      if (orderRes.data?.payment_id) {
        await paymentsApi.process(orderRes.data.payment_id, true);
      }
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(err?.message || 'Failed to place order.');
      throw err;
    }
  };

  if (selectedProduct) {
    return (
      <div className="py-10 max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedProduct(null)}
          icon={ArrowLeft}
          className="mb-4"
        >
          Back to Store
        </Button>
        <Wizard
          steps={steps}
          store={wizardStore}
          onSubmit={handleSubmit}
          onDone={() => {
            setSelectedProduct(null);
            navigate('/student/orders');
          }}
          confirmButtonText="Confirm & Pay"
          doneButtonText="View My Orders"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Official Merchandise Store
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Exclusive club hoodies, t-shirts, and student association apparel
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/student/orders')}
          icon={Package}
        >
          My Orders
        </Button>
      </div>

      {discountPercent > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-primary-soft/40 border border-primary/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">
              Active Member Perk: {discountPercent}% discount is automatically applied to all merchandise at checkout!
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-3 bg-surface">
              <div className="h-40 bg-canvas rounded-md animate-pulse" />
              <div className="h-5 w-3/4 bg-canvas rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-canvas rounded animate-pulse" />
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((prod) => {
            const totalStock = prod.variants?.reduce(
              (acc, v) => acc + (v.stock_quantity || 0),
              0
            ) ?? prod.stock_quantity ?? 0;
            const isOutOfStock = totalStock <= 0;

            return (
              <Card
                key={prod.id}
                className="flex flex-col justify-between p-6 bg-surface border border-line rounded-lg hover:shadow-card transition-all"
              >
                <div>
                  <div className="h-44 rounded-md bg-canvas flex items-center justify-center mb-4 text-muted border border-line">
                    <ShoppingBag className="h-12 w-12 text-primary/40" />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base text-ink">{prod.name}</h3>
                    <span className="font-extrabold text-base text-primary">
                      {formatCurrency(prod.base_price)}
                    </span>
                  </div>

                  <p className="text-xs text-muted line-clamp-2 mb-4 leading-relaxed">
                    {prod.description || 'Official club merchandise item.'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-line">
                    <span>
                      {isOutOfStock ? (
                        <span className="text-danger font-semibold">Out of Stock</span>
                      ) : (
                        <span className="text-success font-semibold">
                          {totalStock} in stock
                        </span>
                      )}
                    </span>
                    <span className="text-muted">
                      {prod.variants?.length || 0} variant(s)
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    disabled={isOutOfStock}
                    onClick={() => startOrder(prod)}
                    icon={!isOutOfStock ? ArrowRight : undefined}
                  >
                    {isOutOfStock ? 'Sold Out' : 'Order Now'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center bg-surface border border-line">
          <ShoppingBag className="h-10 w-10 text-muted mx-auto mb-2" />
          <h3 className="text-base font-bold text-ink">No Products Available</h3>
          <p className="text-xs text-muted mt-1">
            Check back soon for new club merchandise and apparel drops.
          </p>
        </Card>
      )}
    </div>
  );
};

export default MerchandiseStore;
