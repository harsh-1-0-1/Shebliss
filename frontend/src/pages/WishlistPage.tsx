import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '@/store/wishlistStore';
import ProductCard from '@/components/product/ProductCard';

export default function WishlistPage() {
  const { items, clear } = useWishlistStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1A1A1A] tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            My Wishlist
          </h1>
          <p className="text-sm text-[#767676] mt-1">{items.length} {items.length === 1 ? 'piece' : 'pieces'} saved</p>
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="text-xs text-[#767676] hover:text-red-500 transition-colors underline">
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
          <div className="w-16 h-16 border border-[#EFECE6] flex items-center justify-center">
            <Heart size={26} className="text-[#C6A15E]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-display text-xl text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Your wishlist is empty</p>
            <p className="text-sm text-[#767676] mt-1">Save pieces you love and come back to them anytime.</p>
          </div>
          <Link to="/products" className="mt-2 px-8 py-3 bg-[#1A1A1A] text-[#F9F8F6] text-xs font-bold tracking-[0.12em] uppercase hover:bg-[#2B2421] transition-colors">
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
