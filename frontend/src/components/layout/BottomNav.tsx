import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Heart, ShoppingBag, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

const NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/products', icon: LayoutGrid, label: 'Shop' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/cart', icon: ShoppingBag, label: 'Cart', badgeKey: 'cart' as const },
  { to: '/account', icon: UserCircle, label: 'Account', isAccount: true },
];

export default function BottomNav() {
  const { pathname, search } = useLocation();
  const { user, openAuthModal } = useAuthStore();
  const { itemCount, openDrawer } = useCartStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    if (y < 80) { setVisible(true); }
    else {
      const diff = y - lastScrollY.current;
      if (diff > 8) setVisible(true);
      else if (diff < -8) setVisible(false);
    }
    lastScrollY.current = y;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (keyboardOpen) return null;
  if (pathname.startsWith('/admin')) return null;

  const fullPath = pathname + search;

  function isActive(to: string) {
    if (to === '/') return pathname === '/';
    if (to.includes('?')) return fullPath === to;
    return pathname.startsWith(to);
  }

  const GOLD = '#C6A15E';
  const MUTED = '#767676';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#EFECE6] safe-bottom transition-transform duration-300"
      style={{ backgroundColor: '#F9F8F6', transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
    >
      <div className="flex h-[58px] items-center">
        {NAV.map((item) => {
          const active = isActive(item.to);
          const color = active ? GOLD : MUTED;

          // Cart tab — opens drawer
          if (item.to === '/cart') {
            return (
              <button key={item.to} onClick={openDrawer}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 touch-target relative"
              >
                <div className="relative">
                  <item.icon size={21} strokeWidth={active ? 2 : 1.5} color={color} />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-[#C6A15E] text-[#1A1A1A] text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium" style={{ color }}>{item.label}</span>
              </button>
            );
          }

          // Wishlist tab
          if (item.to === '/wishlist') {
            return (
              <Link key={item.to} to={item.to} className="flex flex-1 flex-col items-center justify-center gap-0.5 touch-target relative">
                <div className="relative">
                  <item.icon size={21} strokeWidth={active ? 2 : 1.5} color={color} fill={active ? GOLD : 'none'} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-[#C6A15E] text-[#1A1A1A] text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium" style={{ color }}>{item.label}</span>
              </Link>
            );
          }

          // Account tab
          if (item.isAccount) {
            return (
              <button key={item.to}
                onClick={() => user ? (window.location.href = '/orders') : openAuthModal()}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 touch-target"
              >
                <item.icon size={21} strokeWidth={active ? 2 : 1.5} color={color} />
                <span className="text-[10px] font-medium" style={{ color }}>{item.label}</span>
              </button>
            );
          }

          return (
            <Link key={item.to} to={item.to} className="flex flex-1 flex-col items-center justify-center gap-0.5 touch-target">
              <item.icon size={21} strokeWidth={active ? 2 : 1.5} color={color} />
              <span className="text-[10px] font-medium" style={{ color }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
