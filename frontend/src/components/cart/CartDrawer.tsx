import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatSelectedOptions } from '@/lib/variantDisplay';

function optLabel(item: ReturnType<typeof useCartStore.getState>['items'][number]) {
  if (!item.selected_options) return null;
  return formatSelectedOptions(item.selected_options, item.product.variants) || null;
}

const SUGGESTIONS = [
  { title: 'Earrings', href: '/products?category=earrings', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=120&h=120&fit=crop&q=75' },
  { title: 'Necklaces', href: '/products?category=necklaces', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=120&h=120&fit=crop&q=75' },
  { title: 'Bridal Sets', href: '/products?category=bridal-sets', img: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=120&h=120&fit=crop&q=75' },
  { title: 'Bangles', href: '/products?category=bangles', img: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=120&h=120&fit=crop&q=75' },
];

export default function CartDrawer() {
  const { isDrawerOpen, closeDrawer, items, total, itemCount, updateItem, removeItem } = useCartStore();
  const { format } = useCurrencyStore();
  useBodyScrollLock(isDrawerOpen);
  if (!isDrawerOpen) return null;

  async function handleUpdate(id: number, qty: number) {
    try {
      if (qty <= 0) await removeItem(id);
      else await updateItem(id, qty);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to update');
    }
  }

  async function handleRemove(id: number) {
    try { await removeItem(id); toast.success('Removed'); }
    catch { toast.error('Failed to remove'); }
  }

  const shipping = total >= 999 ? 0 : 99;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={closeDrawer} />
      <div className="fixed inset-0 md:inset-auto md:top-0 md:right-0 md:h-full md:w-[400px] z-50 flex flex-col animate-slide-in-right"
        style={{ backgroundColor: '#F9F8F6' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFECE6] shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} strokeWidth={1.5} className="text-[#C6A15E]" />
            <span className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#1A1A1A]">
              Your Bag {itemCount > 0 && `(${itemCount})`}
            </span>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 flex items-center justify-center text-[#767676] hover:text-[#1A1A1A] transition-colors">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center gap-5">
              <div className="w-14 h-14 border border-[#EFECE6] flex items-center justify-center">
                <ShoppingBag size={22} strokeWidth={1.5} className="text-[#C6A15E]" />
              </div>
              <div>
                <p className="text-[18px] text-[#1A1A1A]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>
                  Your bag is empty
                </p>
                <p className="text-[12px] text-[#767676] mt-1 font-body">Add something beautiful to get started.</p>
              </div>
              <button onClick={closeDrawer}
                className="px-6 py-2.5 bg-[#1A1A1A] text-[#F9F8F6] text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#2B2421] transition-colors">
                Continue Shopping
              </button>
              <div className="w-full pt-4 border-t border-[#EFECE6]">
                <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#767676] mb-3">You might like</p>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Link key={s.title} to={s.href} onClick={closeDrawer}
                      className="group overflow-hidden border border-[#EFECE6] hover:border-[#C6A15E] transition-colors">
                      <div className="aspect-square overflow-hidden">
                        <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      </div>
                      <p className="text-[11px] font-semibold text-[#1A1A1A] px-2 py-2 font-body">{s.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 border border-[#EFECE6]" style={{ backgroundColor: '#EFECE6' }}>
                  <Link to={`/products/${item.product.slug}`} onClick={closeDrawer} className="shrink-0">
                    <img src={item.resolved_image_url || item.product.images?.[0]}
                      alt={item.product.name}
                      className="w-18 h-18 object-cover bg-[#F9F8F6]"
                      style={{ width: 72, height: 72 }}
                      loading="lazy" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product.slug}`} onClick={closeDrawer}
                      className="text-[13px] font-medium text-[#1A1A1A] line-clamp-1 hover:text-[#C6A15E] transition-colors"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {item.product.name}
                    </Link>
                    {optLabel(item) && <p className="text-[10px] text-[#767676] mt-0.5 font-body">{optLabel(item)}</p>}
                    <p className="text-[13px] font-semibold text-[#1A1A1A] mt-1 font-body">{format(item.unit_price)}</p>
                    {item.stock_warning && (
                      <p className="text-[10px] text-red-500 mt-0.5">Only {item.available_stock} left</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-[#F9F8F6]" style={{ backgroundColor: '#F9F8F6' }}>
                        <button onClick={() => handleUpdate(item.id, item.quantity - 1)} className="px-2.5 py-1.5 hover:bg-[#EFECE6] transition-colors touch-target">
                          <Minus size={12} strokeWidth={1.5} />
                        </button>
                        <span className="px-2.5 text-[13px] font-semibold font-body">{item.quantity}</span>
                        <button onClick={() => handleUpdate(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.available_stock}
                          className="px-2.5 py-1.5 hover:bg-[#EFECE6] transition-colors touch-target disabled:opacity-30">
                          <Plus size={12} strokeWidth={1.5} />
                        </button>
                      </div>
                      <button onClick={() => handleRemove(item.id)} className="text-[#767676] hover:text-red-500 transition-colors touch-target">
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[13px] font-bold text-[#1A1A1A] shrink-0 font-body">{format(item.line_total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-[#EFECE6] p-5 space-y-3 safe-bottom">
            <div className="flex justify-between text-[12px] font-body">
              <span className="text-[#767676]">Subtotal</span>
              <span className="font-semibold text-[#1A1A1A]">{format(total)}</span>
            </div>
            <div className="flex justify-between text-[12px] font-body">
              <span className="text-[#767676]">Shipping</span>
              <span className={`font-semibold ${shipping === 0 ? 'text-emerald-600' : 'text-[#1A1A1A]'}`}>
                {shipping === 0 ? 'Free' : format(shipping)}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-[10px] text-[#767676] font-body">Free shipping on orders over {format(999)}</p>
            )}
            <Link to="/cart" onClick={closeDrawer}
              className="flex items-center justify-between w-full px-5 py-3.5 bg-[#1A1A1A] text-[#F9F8F6] text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#2B2421] transition-colors group">
              <span>View Bag & Checkout</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
