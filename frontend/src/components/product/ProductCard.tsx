import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { useQuickViewStore } from '@/store/useQuickViewStore';
import { PLACEHOLDER_IMAGE } from '@/lib/branding';
import type { Product } from '@/types';

// High-contrast named badges derived from product tags (overrides the muted
// tag-badge palette on cards where Bling Bag-style urgency labels are wanted).
const NAMED_BADGES: Record<string, { label: string; className: string }> = {
  'new': { label: 'NEW', className: 'bg-forest text-bone' },
  'new-arrival': { label: 'NEW', className: 'bg-forest text-bone' },
  'best-seller': { label: 'HOT SELLER', className: 'bg-rust text-white' },
  'bestseller': { label: 'HOT SELLER', className: 'bg-rust text-white' },
  'trending': { label: 'TRENDING', className: 'bg-forest text-bone' },
};

function getNamedBadge(tags: string[] | undefined) {
  for (const t of tags ?? []) {
    const key = t.toLowerCase().trim().replace(/\s+/g, '-');
    if (NAMED_BADGES[key]) return NAMED_BADGES[key];
  }
  return null;
}

function getAvailableColors(product: Product) {
  const groups = (product.variants?.variant_groups ?? []).filter((g) => /colou?r/i.test(g.label));
  const seen = new Set<string>();
  const colors: { name: string; hex: string }[] = [];
  for (const group of groups) {
    for (const opt of group.options ?? []) {
      const hex = opt.color_hex || '';
      if (!hex || seen.has(hex)) continue;
      seen.add(hex);
      colors.push({ name: opt.name, hex });
      if (colors.length >= 5) return colors;
    }
  }
  return colors;
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const navigate = useNavigate();
  const { toggle, has } = useWishlistStore();
  const { format } = useCurrencyStore();
  const isWishlisted = has(product.id);
  const [hovered, setHovered] = useState(false);

  const hasVariants = (product.variants?.variant_groups?.length ?? 0) > 0;
  const secondaryImage = product.images?.[1];
  const namedBadge = getNamedBadge(product.tags);
  const availableColors = getAvailableColors(product);
  const totalColors = (product.variants?.variant_groups ?? [])
    .filter((g) => /colou?r/i.test(g.label))
    .reduce((n, g) => n + (g.options ?? []).filter((o) => o.color_hex).length, 0);

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null;

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) { navigate(`/products/${product.slug}`); return; }
    try {
      await addItem(product.id, 1, product);
      toast.success(`${product.name} added to bag`);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to add');
    }
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
    toast.success(has(product.id) ? 'Removed from wishlist' : 'Added to wishlist');
  }

  function handleQuickView(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    useQuickViewStore.getState().open(product.slug);
  }

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col h-full bg-[#F9F8F6]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image — strict 3:4 aspect ratio, object-fit:cover */}
      <div className="relative overflow-hidden bg-[#EFECE6]" style={{ aspectRatio: '3/4' }}>
        {/* Primary image */}
        <img
          src={product.images?.[0] || PLACEHOLDER_IMAGE}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${hovered && secondaryImage ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
        />
        {/* Secondary (hover) image */}
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.name} — alternate view`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${hovered ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {/* Badge stack — named tag, discount, product badge */}
        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
          {namedBadge && (
            <span className={`text-[8px] font-bold px-2 py-1 tracking-[0.14em] uppercase ${namedBadge.className}`}>
              {namedBadge.label}
            </span>
          )}
          {discount !== null && discount > 0 && (
            <span className="bg-rust text-bone text-[8px] font-bold px-2 py-1 tracking-[0.12em] uppercase rounded-sm">
              −{discount}%
            </span>
          )}
          {product.badge && !discount && (
            <span className="bg-gold text-ink text-[8px] font-bold px-2 py-1 tracking-wider uppercase">
              {product.badge}
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center transition-all duration-200 ${
            hovered || isWishlisted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Heart
            size={17}
            strokeWidth={1.5}
            className="transition-colors duration-200"
            fill={isWishlisted ? '#C6A15E' : 'none'}
            stroke={isWishlisted ? '#C6A15E' : '#1A1A1A'}
          />
        </button>

        {/* Quick view — always visible on mobile, hover reveal on desktop */}
        <button
          onClick={handleQuickView}
          aria-label="Quick view"
          className="absolute bottom-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center bg-[#F9F8F6]/90 backdrop-blur-sm border border-[#EFECE6] text-[#1A1A1A] hover:text-gold transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Eye size={16} strokeWidth={1.5} />
        </button>

        {/* Quick add — appears on hover */}
        <div className={`absolute bottom-0 left-0 right-0 z-10 transition-transform duration-300 ease-out ${hovered ? 'translate-y-0' : 'translate-y-full'}`}>
          {product.stock_qty === 0 ? (
            <div className="w-full py-2.5 bg-[#EFECE6] text-[#767676] text-[10px] font-bold tracking-[0.14em] uppercase text-center">
              Out of Stock
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-full py-2.5 bg-rust text-bone text-[10px] font-bold tracking-[0.14em] uppercase hover:bg-[#a84326] transition-colors"
            >
              {hasVariants ? 'Choose Options' : 'Add to Bag'}
            </button>
          )}
        </div>
      </div>

      {/* Text content */}
      <div className="pt-3 pb-1 px-0.5 flex flex-col gap-1">
        {/* Colour swatch strip */}
        {availableColors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {availableColors.map((c) => (
              <span
                key={c.hex}
                title={c.name}
                aria-label={c.name}
                className="w-3.5 h-3.5 rounded-full border border-[#EFECE6] shrink-0"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {totalColors > availableColors.length && (
              <span className="text-[9px] text-slate font-medium">+{totalColors - availableColors.length}</span>
            )}
          </div>
        )}

        {/* Sub-label (category/finish) */}
        {product.tags?.length > 0 && (
          <p
            className="text-[#767676] uppercase leading-none font-body"
            style={{ fontSize: '9px', letterSpacing: '0.1em', fontWeight: 600 }}
          >
            {product.tags.slice(0, 2).map((t) =>
              t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            ).join(' · ')}
          </p>
        )}

        {/* Product name */}
        <h3
          className="text-[14px] sm:text-[15px] leading-snug text-[#1A1A1A] line-clamp-2 group-hover:text-[#C6A15E] transition-colors duration-200 font-body"
          style={{ fontWeight: 500, letterSpacing: '0.02em' }}
        >
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-[13px] font-semibold text-[#1A1A1A] font-body">
            {hasVariants && <span className="text-[11px] font-normal text-[#767676] mr-0.5">from </span>}
            {format(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-[11px] text-[#767676] line-through font-body">
              {format(product.original_price)}
            </span>
          )}
        </div>

        {/* Stock warning */}
        {product.stock_qty > 0 && product.stock_qty <= 5 && (
          <p className="text-[10px] text-[#C6A15E] font-semibold">Only {product.stock_qty} left</p>
        )}
      </div>
    </Link>
  );
}
