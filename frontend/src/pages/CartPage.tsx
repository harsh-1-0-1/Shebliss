import { Link } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { formatSelectedOptions } from '@/lib/variantDisplay';

function optLabel(item: ReturnType<typeof useCartStore.getState>['items'][number]) {
  if (!item.selected_options) return null;
  return formatSelectedOptions(item.selected_options, item.product.variants) || null;
}

const EMPTY_COLLECTIONS = [
  { title: 'Ear Ring', sub: 'Jumkas & studs', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop&q=75', href: '/products?category=ear-ring' },
  { title: 'Necklaces Sets', sub: 'Choker sets & chains', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop&q=75', href: '/products?category=necklaces-sets' },
  { title: 'Wedding Jewells', sub: 'Complete looks', img: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=300&fit=crop&q=75', href: '/products?category=wedding-jewells' },
  { title: 'Sale', sub: 'Up to 50% off', img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=300&fit=crop&q=75', href: '/products?tags=offers' },
];

export default function CartPage() {
  const { items, total, itemCount, updateItem, removeItem } = useCartStore();
  const { format } = useCurrencyStore();

  async function handleUpdate(id: number, qty: number) {
    try { if (qty <= 0) await removeItem(id); else await updateItem(id, qty); }
    catch (err: unknown) { toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Update failed'); }
  }
  async function handleRemove(id: number) {
    try { await removeItem(id); toast.success('Removed from bag'); }
    catch { toast.error('Remove failed'); }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16" style={{ backgroundColor: '#F9F8F6' }}>
        <div className="flex flex-col items-center text-center mb-12 gap-4">
          <div className="w-14 h-14 border border-[#EFECE6] flex items-center justify-center">
            <ShoppingBag size={22} strokeWidth={1.5} className="text-[#C6A15E]" />
          </div>
          <h1 className="text-3xl text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>
            Your bag is empty
          </h1>
          <p className="text-[13px] text-[#767676] font-body max-w-xs">
            Explore our collections and discover pieces made to be treasured.
          </p>
          <Link to="/products" className="px-8 py-3 bg-[#1A1A1A] text-[#F9F8F6] text-[11px] font-bold tracking-[0.16em] uppercase hover:bg-[#2B2421] transition-colors">
            Explore Collection
          </Link>
        </div>
        <p className="text-[9px] font-bold tracking-[0.28em] uppercase text-[#767676] mb-5 text-center">You might love</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {EMPTY_COLLECTIONS.map((c) => (
            <Link key={c.title} to={c.href}
              className="group overflow-hidden border border-[#EFECE6] hover:border-[#C6A15E] transition-colors">
              <div className="overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600" loading="lazy" />
              </div>
              <div className="p-3">
                <p className="text-[13px] font-medium text-[#1A1A1A] font-body">{c.title}</p>
                <p className="text-[10px] text-[#C6A15E] font-semibold mt-0.5 font-body">{c.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const shipping = total >= 999 ? 0 : 99;
  const grandTotal = total + shipping;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 py-8 sm:py-12" style={{ backgroundColor: '#F9F8F6' }}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.28em] uppercase text-[#C6A15E] mb-1">Shopping</p>
        <h1 className="text-3xl sm:text-4xl text-[#1A1A1A] leading-none"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.02em' }}>
          Your Bag <span className="text-[#767676] text-2xl">({itemCount})</span>
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border border-[#EFECE6]" style={{ backgroundColor: '#EFECE6' }}>
              <Link to={`/products/${item.product.slug}`} className="shrink-0">
                <img src={item.resolved_image_url || item.product.images?.[0]}
                  alt={item.product.name}
                  className="object-cover bg-[#F9F8F6]"
                  style={{ width: 96, height: 96 }}
                  loading="lazy" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product.slug}`}
                  className="text-[15px] font-medium text-[#1A1A1A] hover:text-[#C6A15E] transition-colors line-clamp-1"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {item.product.name}
                </Link>
                {optLabel(item) && <p className="text-[11px] text-[#767676] mt-0.5 font-body">{optLabel(item)}</p>}
                <p className="text-[14px] font-semibold text-[#1A1A1A] mt-1 font-body">{format(item.unit_price)}</p>
                {item.stock_warning && <p className="text-[11px] text-red-500 mt-0.5">Only {item.available_stock} left</p>}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center border border-[#F9F8F6]" style={{ backgroundColor: '#F9F8F6' }}>
                    <button onClick={() => handleUpdate(item.id, item.quantity - 1)} className="px-3 py-2 hover:bg-[#EFECE6] transition-colors touch-target">
                      <Minus size={13} strokeWidth={1.5} />
                    </button>
                    <span className="px-3 text-[13px] font-semibold font-body min-w-[2rem] text-center">{item.quantity}</span>
                    <button onClick={() => handleUpdate(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.available_stock}
                      className="px-3 py-2 hover:bg-[#EFECE6] transition-colors touch-target disabled:opacity-30">
                      <Plus size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                  <button onClick={() => handleRemove(item.id)} className="flex items-center gap-1.5 text-[11px] text-[#767676] hover:text-red-500 transition-colors touch-target font-body">
                    <Trash2 size={13} strokeWidth={1.5} /> <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
              <p className="text-[14px] font-bold text-[#1A1A1A] shrink-0 font-body">{format(item.line_total)}</p>
            </div>
          ))}
        </div>

        {/* Order summary — desktop sticky */}
        <div className="lg:col-span-1">
          <div className="border border-[#EFECE6] p-6 space-y-4 lg:sticky lg:top-24" style={{ backgroundColor: '#EFECE6' }}>
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A]">Order Summary</h2>
            <div className="space-y-2.5 text-[13px] font-body">
              <div className="flex justify-between"><span className="text-[#767676]">Subtotal</span><span className="font-medium text-[#1A1A1A]">{format(total)}</span></div>
              <div className="flex justify-between"><span className="text-[#767676]">Shipping</span>
                <span className={`font-medium ${shipping === 0 ? 'text-emerald-600' : 'text-[#1A1A1A]'}`}>{shipping === 0 ? 'Free' : format(shipping)}</span>
              </div>
              {shipping > 0 && <p className="text-[10px] text-[#767676]">Free shipping on orders above {format(999)}</p>}
            </div>
            <div className="border-t border-[#F9F8F6] pt-3 flex justify-between">
              <span className="text-[13px] font-bold text-[#1A1A1A] font-body">Total</span>
              <span className="text-[16px] font-bold text-[#1A1A1A] font-body">{format(grandTotal)}</span>
            </div>
            {/* Promo code */}
            <div className="flex gap-0">
              <input type="text" placeholder="Promo code"
                className="flex-1 px-3 py-2.5 text-[12px] border border-[#F9F8F6] bg-[#F9F8F6] focus:outline-none focus:border-[#C6A15E] transition-colors font-body" />
              <button className="px-4 py-2.5 bg-[#1A1A1A] text-[#F9F8F6] text-[11px] font-bold tracking-wider hover:bg-[#2B2421] transition-colors font-body whitespace-nowrap">Apply</button>
            </div>
            <Link to="/checkout"
              className="flex items-center justify-between w-full px-5 py-3.5 bg-[#1A1A1A] text-[#F9F8F6] text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#2B2421] transition-colors group">
              <span>Proceed to Checkout</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Mobile summary */}
        <div className="lg:hidden border border-[#EFECE6] p-4 space-y-3" style={{ backgroundColor: '#EFECE6' }}>
          <div className="flex justify-between text-[12px] font-body"><span className="text-[#767676]">Subtotal</span><span>{format(total)}</span></div>
          <div className="flex justify-between text-[12px] font-body"><span className="text-[#767676]">Shipping</span>
            <span className={shipping === 0 ? 'text-emerald-600' : ''}>{shipping === 0 ? 'Free' : format(shipping)}</span>
          </div>
          <div className="flex justify-between font-bold text-[14px] border-t border-[#F9F8F6] pt-2 font-body">
            <span>Total</span><span>{format(grandTotal)}</span>
          </div>
          <Link to="/checkout" className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#1A1A1A] text-[#F9F8F6] text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#2B2421] transition-colors">
            Checkout — {format(grandTotal)} <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
