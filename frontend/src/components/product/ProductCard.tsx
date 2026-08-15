import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCurrencyStore } from '@/store/currencyStore';
import type { Product } from '@/types';

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const navigate = useNavigate();
  const { toggle, has } = useWishlistStore();
  const { format } = useCurrencyStore();
  const isWishlisted = has(product.id);
  const [hovered, setHovered] = useState(false);

  const hasVariants = (product.variants?.variant_groups?.length ?? 0) > 0;
  const secondaryImage = product.images?.[1];

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
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=800&fit=crop&q=80'}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${hovered && secondaryImage ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=800&fit=crop&q=80'; }}
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

        {/* Discount badge — refined pill style */}
        {discount !== null && discount > 0 && (
          <span className="absolute top-2 left-2 border border-[#1A1A1A]/80 bg-[#F9F8F6]/90 backdrop-blur-sm text-[#1A1A1A] text-[8px] font-bold px-1.5 py-0.5 tracking-[0.12em] uppercase z-10 rounded-sm">
            −{discount}%
          </span>
        )}

        {/* Named badge */}
        {product.badge && !discount && (
          <span className="absolute top-0 left-0 bg-[#C6A15E] text-[#1A1A1A] text-[9px] font-bold px-2.5 py-1.5 tracking-wider uppercase z-10">
            {product.badge}
          </span>
        )}

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

        {/* Quick add — appears on hover */}
        <div className={`absolute bottom-0 left-0 right-0 z-10 transition-transform duration-300 ease-out ${hovered ? 'translate-y-0' : 'translate-y-full'}`}>
          {product.stock_qty === 0 ? (
            <div className="w-full py-2.5 bg-[#EFECE6] text-[#767676] text-[10px] font-bold tracking-[0.14em] uppercase text-center">
              Out of Stock
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-full py-2.5 bg-[#1A1A1A] text-[#F9F8F6] text-[10px] font-bold tracking-[0.14em] uppercase hover:bg-[#2B2421] transition-colors"
            >
              {hasVariants ? 'Choose Options' : 'Add to Bag'}
            </button>
          )}
        </div>
      </div>

      {/* Text content */}
      <div className="pt-3 pb-1 px-0.5 flex flex-col gap-1">
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
