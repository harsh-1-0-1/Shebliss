import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProduct } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cartStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { useQuickViewStore } from '@/store/useQuickViewStore';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { getApiErrorDetail } from '@/lib/apiError';
import { PLACEHOLDER_IMAGE } from '@/lib/branding';
import Spinner from '@/components/ui/Spinner';
import VariantPicker from '@/components/product/VariantPicker';
import type { VariantGroup, VariantOption } from '@/types';

export default function QuickViewModal() {
  const { slug, close } = useQuickViewStore();
  const { data: product, isLoading } = useProduct(slug ?? '');
  const addItem = useCartStore((s) => s.addItem);
  const { format } = useCurrencyStore();
  const [qty, setQty] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [lastProductId, setLastProductId] = useState<number | null>(null);

  useBodyScrollLock(!!slug);

  // Reset selection whenever the viewed product changes.
  if (product && lastProductId !== product.id) {
    setLastProductId(product.id);
    setSelectedOptions({});
    setQty(1);
  }

  if (!slug) return null;

  const groups: VariantGroup[] = product?.variants?.variant_groups ?? [];
  const hasGroups = groups.length > 0;
  const stockMap: Record<string, number> | null = hasGroups
    ? product?.variants?.stock_map ?? null
    : null;

  // Price: sum of selected option prices; falls back to product.price when no
  // group has a selection yet. Mirrors the PDP logic.
  const optionById: Record<string, VariantOption> = {};
  for (const group of groups) {
    for (const opt of group.options ?? []) {
      optionById[opt.id] = opt;
    }
  }
  const hasAnySelection = Object.keys(selectedOptions).length > 0;
  const selectedOptionsPrice = Object.values(selectedOptions).reduce(
    (sum, optId) => sum + Number(optionById[optId]?.price ?? 0),
    0,
  );
  const displayPrice = hasGroups && hasAnySelection ? selectedOptionsPrice : Number(product?.price ?? 0);
  const basePrice = Number(product?.price ?? 0);
  const baseOriginalPrice = Number(product?.original_price ?? 0);
  const scaledVariantOriginalPrice =
    hasGroups && basePrice > 0 && baseOriginalPrice > basePrice
      ? Math.round(displayPrice * (baseOriginalPrice / basePrice))
      : null;
  const displayOriginalPrice =
    baseOriginalPrice > displayPrice
      ? baseOriginalPrice
      : scaledVariantOriginalPrice && scaledVariantOriginalPrice > displayPrice
        ? scaledVariantOriginalPrice
        : null;
  const discount =
    displayOriginalPrice && displayOriginalPrice > displayPrice
      ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
      : null;

  // Availability: per-combination stock when the product has variant groups.
  const allGroupsHaveSelection = groups.every((g) => selectedOptions[g.id]);
  const comboKey = allGroupsHaveSelection
    ? groups.map((g) => selectedOptions[g.id]).filter(Boolean).join('__')
    : '';
  const effectiveStock = hasGroups
    ? Number(stockMap?.[comboKey] ?? 0)
    : product?.stock_qty ?? 0;
  const allGroupsSelected = hasGroups ? groups.every((g) => selectedOptions[g.id]) : true;
  const missingStockMap = hasGroups && !stockMap;
  const isUnavailable = (hasGroups && !allGroupsSelected) || missingStockMap || effectiveStock <= 0;

  async function handleAdd() {
    if (!product) return;
    const cartOptions = Object.values(selectedOptions);
    try {
      await addItem(product.id, qty, product, hasGroups ? cartOptions : null);
      close();
    } catch (err) {
      toast.error(getApiErrorDetail(err, 'Failed to add'));
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[70]" onClick={close} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-bone shadow-2xl animate-dropdown"
          role="dialog"
          aria-modal="true"
          aria-label="Quick view"
        >
          {isLoading || !product ? (
            <div className="py-24 flex items-center justify-center"><Spinner /></div>
          ) : (
            <div className="grid md:grid-cols-2">
              {/* Image */}
              <div className="relative aspect-[3/4] bg-card overflow-hidden md:aspect-auto md:min-h-[420px]">
                <img
                  src={product.images?.[0] || PLACEHOLDER_IMAGE}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
                <button
                  onClick={close}
                  aria-label="Close"
                  className="absolute top-2.5 right-2.5 z-10 w-9 h-9 flex items-center justify-center bg-bone border border-card text-espresso hover:text-gold transition-colors"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Details */}
              <div className="p-5 sm:p-6 flex flex-col">
                <Link
                  to={`/products/${product.slug}`}
                  onClick={close}
                  className="font-display text-lg sm:text-xl text-espresso leading-snug line-clamp-2 hover:text-gold transition-colors"
                >
                  {product.name}
                </Link>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-xl font-bold text-espresso">{format(displayPrice)}</span>
                  {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                    <>
                      <span className="text-sm text-slate line-through">{format(displayOriginalPrice)}</span>
                      <span className="text-xs font-semibold text-sale bg-sale/10 px-1.5 py-0.5">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>

                <p className={`text-xs font-medium mt-1.5 ${effectiveStock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {missingStockMap
                    ? 'Product configuration unavailable'
                    : effectiveStock > 0
                      ? `In Stock${effectiveStock <= 5 ? ` (Only ${effectiveStock} left)` : ''}`
                      : 'Out of Stock'}
                </p>

                {hasGroups && (
                  <div className="mt-4">
                    <VariantPicker
                      groups={groups}
                      stockMap={stockMap}
                      selectedOptions={selectedOptions}
                      onSelect={(next) => { setSelectedOptions(next); setQty(1); }}
                    />
                  </div>
                )}

                {!isUnavailable && (
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex items-center border border-card bg-bone shrink-0">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2.5 text-espresso hover:text-gold transition-colors touch-target" aria-label="Decrease quantity">
                        <Minus size={14} strokeWidth={1.5} />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">{qty}</span>
                      <button onClick={() => setQty(Math.min(Math.max(effectiveStock, 1), qty + 1))} className="px-3 py-2.5 text-espresso hover:text-gold transition-colors touch-target" aria-label="Increase quantity">
                        <Plus size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    <button
                      onClick={handleAdd}
                      className="flex-1 py-3 bg-rust text-bone text-xs font-bold uppercase tracking-[0.14em] hover:bg-[#a84326] transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                      <ShoppingBag size={15} strokeWidth={1.5} /> Add to Bag
                    </button>
                  </div>
                )}

                <Link
                  to={`/products/${product.slug}`}
                  onClick={close}
                  className="mt-4 text-center text-xs font-semibold text-gold uppercase tracking-wider underline-offset-4 hover:underline"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}