import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown, ChevronLeft, ChevronRight,
  FileCheck2, Heart, LogOut, Menu, Package,
  Search, Settings, ShieldCheck, ShoppingBag, User, X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useDebounce } from '@/hooks/useDebounce';
import { useBanners } from '@/hooks/useBanners';
import type { ProductListResponse } from '@/types';
import { NAV_ITEMS, WHATSAPP_NUMBER } from './navData';
import type { NavItemDef } from './navData';
import { APP_NAME } from '@/lib/branding';
import { useCurrencyStore } from '@/store/currencyStore';

// ── Logo wordmark ─────────────────────────────────────────────────────────────
function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className="flex flex-col items-center group select-none">
      <span
        className="font-display text-[22px] sm:text-[26px] leading-none tracking-[0.12em] text-[#1A1A1A] group-hover:text-[#C6A15E] transition-colors duration-300"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
      >
        {APP_NAME.toUpperCase()}
      </span>
      <span
        className="text-[7px] tracking-[0.35em] uppercase text-[#767676] mt-0.5 font-body"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Fine Artificial Jewellery
      </span>
    </Link>
  );
}

const FALLBACK_MOBILE_ITEMS = [
  { label: 'Earrings', href: '/products?category=earrings', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=80&h=80&fit=crop&q=80' },
  { label: 'Necklaces', href: '/products?category=necklaces', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=80&h=80&fit=crop&q=80' },
  { label: 'Bangles & Kada', href: '/products?category=bangles', img: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=80&h=80&fit=crop&q=80' },
  { label: 'Bridal', href: '/products?category=bridal-sets', img: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=80&h=80&fit=crop&q=80' },
  { label: 'Mangalsutra & Sets', href: '/products?category=mangalsutra', img: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=80&h=80&fit=crop&q=80' },
  { label: 'Gift Sets', href: '/products?tags=combo', img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=80&h=80&fit=crop&q=80' },
  { label: 'Corporate Gifts', href: '/corporate-gifting', img: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=80&h=80&fit=crop&q=80' },
  { label: 'Sale', href: '/products?tags=offers', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=80&h=80&fit=crop&q=80' },
  { label: 'Blog', href: '/blog', img: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=80&h=80&fit=crop&q=80' },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const lastScrollY = useRef(0);
  const hoverTimeoutRef = useRef<number>(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const { user, openAuthModal, logout } = useAuthStore();
  const { itemCount, openDrawer } = useCartStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { format } = useCurrencyStore();

  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: mobilePromoBanners = [] } = useBanners('mobile_promo');
  const { data: menuBanners = [] } = useBanners('menu_banner');
  const mobilePromoBanner = mobilePromoBanners[0];
  const mobileMenuItems = menuBanners.length > 0
    ? menuBanners.map((b) => ({ label: b.title, href: b.cta_link || '/products', img: b.image_url || '' }))
    : FALLBACK_MOBILE_ITEMS;

  useBodyScrollLock(drawerOpen);
  useEffect(() => () => clearTimeout(hoverTimeoutRef.current), []);

  // Scroll behaviour
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (y < 80) { setHidden(false); }
      else {
        const diff = y - lastScrollY.current;
        if (diff > 8) setHidden(true);
        else if (diff < -8) setHidden(false);
      }
      if (Math.abs(y - lastScrollY.current) > 4) setSearchOpen(false);
      lastScrollY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Click-outside for search
  useEffect(() => {
    function onPD(e: PointerEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false); setSearchOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPD);
    return () => document.removeEventListener('pointerdown', onPD);
  }, []);

  // Live search
  const { data: suggestions } = useQuery({
    queryKey: ['search-sugg', debouncedQuery],
    queryFn: async () => {
      const { data } = await api.get<ProductListResponse>('/products', { params: { search: debouncedQuery, limit: 5 } });
      return data.items;
    },
    enabled: debouncedQuery.length >= 2,
  });
  const showSuggestions = searchFocused && debouncedQuery.length >= 2 && suggestions && suggestions.length > 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(''); setSearchFocused(false); setSearchOpen(false); setDrawerOpen(false);
    }
  }

  function handleDropdownEnter(label: string) {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => setActiveDropdown(label), 180);
  }
  function handleDropdownLeave() {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => setActiveDropdown(null), 140);
  }
  function closeDrawer() { setDrawerOpen(false); setActiveSubmenu(null); }

  function getSubcategories(label: string) {
    const clean = label.toLowerCase().trim();
    const navItem = NAV_ITEMS.find((item) => item.label.toLowerCase().trim() === clean);
    if (navItem?.groups) {
      const links: { label: string; href: string }[] = [{ label: `All ${label}`, href: navItem.href }];
      navItem.groups.forEach((col) => col.forEach((grp) => grp.links.forEach((lk) => {
        if (!links.some((l) => l.label.toLowerCase() === lk.label.toLowerCase())) links.push(lk);
      })));
      return links;
    }
    if (clean === 'gift sets' || clean === 'gifts') return [
      { label: 'All Gift Sets', href: '/products?tags=combo' },
      { label: 'Bundle Deals', href: '/products?tags=bundle' },
      { label: 'Corporate Gifting', href: '/corporate-gifting' },
    ];
    return null;
  }

  function isNavActive(item: NavItemDef): boolean {
    const p = new URLSearchParams(location.search);
    const curCat = p.get('category') || '';
    const curTag = p.get('tags') || p.get('tag') || '';
    const [, iSearch] = item.href.split('?');
    const ip = new URLSearchParams(iSearch || '');
    if (ip.get('category') === curCat && curCat) return true;
    if ((ip.get('tags') || ip.get('tag')) === curTag && curTag) return true;
    if (!item.href.startsWith('/products') && location.pathname === item.href.split('?')[0]) return true;
    if (item.groups) {
      for (const col of item.groups) for (const grp of col) for (const lk of grp.links) {
        const lp = new URLSearchParams(lk.href.split('?')[1] || '');
        if (lp.get('category') === curCat && curCat) return true;
      }
    }
    return false;
  }



  return (
    <header
      className={clsx(
        'sticky top-0 z-50 transition-all duration-300 ease-in-out',
        scrolled ? 'shadow-[0_2px_16px_rgba(0,0,0,0.08)] bg-[#F9F8F6]/98 backdrop-blur-sm' : 'bg-[#F9F8F6]',
        hidden && '-translate-y-full',
      )}
    >
      {/* ── Main header row ── */}
      <div className={clsx(
        'mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 flex items-center relative transition-all duration-300',
        scrolled ? 'h-[60px] sm:h-[68px]' : 'h-[72px] sm:h-[80px] lg:h-[88px]',
      )}>
        {/* Hamburger (mobile) */}
        {!isAdminPath && (
          <button
            className="p-2 -ml-1 text-[#2B2421] hover:text-[#C6A15E] transition-colors touch-target lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
        )}

        {/* Logo — centred on mobile, left-flow on desktop */}
        <div className="absolute left-1/2 -translate-x-1/2 lg:relative lg:left-auto lg:translate-x-0 z-10">
          <Logo />
        </div>

        {/* Desktop nav — centre */}
        {!isAdminPath && <nav className="hidden lg:flex items-center gap-0 mx-auto">
          {NAV_ITEMS.map((item) => {
            const hasDD = !!(item.groups?.length);
            const isOpen = activeDropdown === item.label;
            const active = isNavActive(item);
            const isWide = (item.groups?.length ?? 0) > 1;
            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={hasDD ? () => handleDropdownEnter(item.label) : undefined}
                onMouseLeave={hasDD ? handleDropdownLeave : undefined}
              >
                <Link
                  to={item.href}
                  className={clsx(
                    'flex items-center gap-1 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors group relative whitespace-nowrap',
                    item.highlight ? 'text-[#C6A15E]' : active ? 'text-[#1A1A1A]' : 'text-[#2B2421]/70 hover:text-[#1A1A1A]',
                  )}
                >
                  {item.label}
                  {hasDD && <ChevronDown size={10} className={clsx('opacity-50 transition-transform', isOpen && 'rotate-180')} />}
                  <span className={clsx(
                    'absolute bottom-0 left-4 right-4 h-[1.5px] bg-[#C6A15E] transition-transform origin-left duration-200',
                    active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                  )} />
                </Link>

                {/* Mega dropdown */}
                {hasDD && isOpen && (
                  <div
                    className={clsx(
                      'absolute top-full left-0 bg-[#F9F8F6] border border-[#EFECE6] shadow-2xl z-50 animate-dropdown',
                      isWide ? 'grid grid-cols-2 gap-6 p-6 w-[480px]' : 'p-5 w-56',
                    )}
                    onMouseEnter={() => { clearTimeout(hoverTimeoutRef.current); setActiveDropdown(item.label); }}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {item.groups!.map((col, ci) => (
                      <div key={ci} className="space-y-4">
                        {col.map((grp, gi) => (
                          <div key={gi}>
                            {grp.title && (
                              <p className="text-[9px] font-bold text-[#767676] uppercase tracking-[0.2em] mb-2 pb-1.5 border-b border-[#EFECE6]">
                                {grp.title}
                              </p>
                            )}
                            {grp.links.map((lk) => (
                              <Link
                                key={lk.href} to={lk.href}
                                onClick={() => setActiveDropdown(null)}
                                className="flex items-center gap-2 py-1.5 text-[12px] text-[#2B2421]/70 hover:text-[#1A1A1A] hover:translate-x-1 transition-all duration-150"
                              >
                                <span className="w-1 h-1 rounded-full bg-[#C6A15E]/50 shrink-0" />
                                {lk.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>}

        {/* Right icons */}
        <div className="flex items-center gap-0 ml-auto shrink-0">
          {/* Search */}
          <button
            onClick={() => { setSearchOpen((v) => { if (!v) setTimeout(() => document.querySelector<HTMLInputElement>('.nav-search-input')?.focus(), 50); return !v; }); }}
            className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 text-[#2B2421]/70 hover:text-[#1A1A1A] transition-colors"
            aria-label="Search"
          >
            <Search size={19} strokeWidth={1.5} />
          </button>

          {!isAdminPath && (
            <Link
              to="/wishlist"
              className="relative flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 text-[#2B2421]/70 hover:text-[#1A1A1A] transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={19} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#C6A15E] text-[#1A1A1A] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>
          )}

          {/* Account */}
          {user ? (
            <div className={clsx('relative', isAdminPath ? 'block' : 'hidden lg:block')}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center justify-center w-10 h-10 text-[#2B2421]/70 hover:text-[#1A1A1A] transition-colors touch-target"
                aria-label="Account"
              >
                <User size={19} strokeWidth={1.5} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-[#F9F8F6] border border-[#EFECE6] shadow-2xl z-50 py-1 animate-dropdown">
                    <div className="px-4 py-3 border-b border-[#EFECE6]">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">{user.full_name || 'Account'}</p>
                      <p className="text-xs text-[#767676] truncate mt-0.5">{user.email}</p>
                    </div>
                    {user.is_admin && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#C6A15E] hover:bg-[#EFECE6] transition-colors">
                        <Settings size={13} /> Admin Panel
                      </Link>
                    )}
                    <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#2B2421] hover:bg-[#EFECE6] transition-colors">
                      <Package size={13} /> My Orders
                    </Link>
                    <Link to="/damage-replacement" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#2B2421] hover:bg-[#EFECE6] transition-colors">
                      <ShieldCheck size={13} /> Damage Replacement
                    </Link>
                    <Link to="/damage-claims" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#2B2421] hover:bg-[#EFECE6] transition-colors">
                      <FileCheck2 size={13} /> My Claims
                    </Link>
                    <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={13} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className={clsx(
                'items-center justify-center w-10 h-10 text-[#2B2421]/70 hover:text-[#1A1A1A] transition-colors touch-target',
                isAdminPath ? 'flex' : 'hidden lg:flex',
              )}
              aria-label="Login"
            >
              <User size={19} strokeWidth={1.5} />
            </button>
          )}

          {!isAdminPath && (
            <button
              onClick={openDrawer}
              className="relative flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 text-[#2B2421]/70 hover:text-[#1A1A1A] transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={19} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#C6A15E] text-[#1A1A1A] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div
        ref={searchContainerRef}
        className={clsx(
          'border-t border-[#EFECE6] bg-[#F9F8F6] overflow-hidden transition-all duration-300',
          searchOpen ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="mx-auto max-w-3xl px-4 py-2.5">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search size={14} className="absolute left-4 text-[#767676] pointer-events-none" />
            <input
              type="text" placeholder="Search jewellery…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearchFocused(false); } }}
              className="nav-search-input w-full pl-10 pr-4 py-2.5 border border-[#EFECE6] bg-white text-sm focus:outline-none focus:border-[#C6A15E] transition-colors placeholder:text-[#767676]/60"
            />
          </form>
          {showSuggestions && (
            <div className="absolute top-full left-4 right-4 bg-[#F9F8F6] border border-[#EFECE6] shadow-2xl z-50 animate-dropdown">
              {suggestions!.map((p) => (
                <Link key={p.id} to={`/products/${p.slug}`} onClick={() => { setSearchOpen(false); setSearchFocused(false); setSearchQuery(''); }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#EFECE6] transition-colors border-b border-[#EFECE6] last:border-0"
                >
                  <img src={p.images?.[0]} alt="" className="w-10 h-10 object-cover shrink-0 bg-[#EFECE6]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">{p.name}</p>
                    <p className="text-xs text-[#C6A15E] font-semibold mt-0.5">{format(p.price)}</p>
                  </div>
                </Link>
              ))}
              <Link to={`/products?search=${encodeURIComponent(debouncedQuery)}`} onClick={() => { setSearchOpen(false); setSearchFocused(false); setSearchQuery(''); }}
                className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-[#C6A15E] hover:bg-[#EFECE6] transition-colors"
              >
                <Search size={12} /> View all results for "{debouncedQuery}"
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {!isAdminPath && <div className={clsx('fixed inset-0 z-50 transition-all duration-500', drawerOpen ? 'visible' : 'invisible pointer-events-none')}>
        <div className={clsx('absolute inset-0 bg-black/50 transition-opacity duration-500', drawerOpen ? 'opacity-100' : 'opacity-0')} onClick={closeDrawer} />
        <div
          className={clsx(
            'fixed top-0 left-0 w-[82vw] max-w-[360px] h-full bg-[#F9F8F6] shadow-2xl flex flex-col overflow-hidden transition-transform duration-500',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <div className="w-[200%] h-full flex transition-transform duration-500" style={{ transform: activeSubmenu ? 'translateX(-50%)' : 'translateX(0)', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>

            {/* PANEL 1: Main menu */}
            <div className="w-1/2 h-full flex flex-col shrink-0 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFECE6] shrink-0">
                <Logo onClick={closeDrawer} />
                <button onClick={closeDrawer} className="w-8 h-8 flex items-center justify-center text-[#767676] hover:text-[#1A1A1A] transition-colors" aria-label="Close">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Promo banner */}
              {mobilePromoBanner && (
                <div className="px-4 py-3 border-b border-[#EFECE6] shrink-0">
                  <Link to={mobilePromoBanner.cta_link || '/products'} onClick={closeDrawer}
                    className="flex items-center gap-3 p-3 bg-[#EFECE6] group transition active:scale-[0.98]"
                  >
                    {mobilePromoBanner.image_url && (
                      <img src={mobilePromoBanner.image_url} alt="" className="w-11 h-11 object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-[#C6A15E] uppercase tracking-wider">{mobilePromoBanner.badge_text || 'Limited Offer'}</p>
                      <p className="text-xs font-semibold text-[#1A1A1A] truncate mt-0.5">{mobilePromoBanner.title}</p>
                    </div>
                    <ChevronRight size={14} className="text-[#767676] shrink-0" />
                  </Link>
                </div>
              )}

              {/* Auth */}
              <div className="px-4 py-3 border-b border-[#EFECE6] shrink-0">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#C6A15E] font-bold text-xs shrink-0">
                        {(user.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1A1A1A] truncate">{user.full_name || 'Account'}</p>
                        <p className="text-[10px] text-[#767676] truncate">{user.email}</p>
                      </div>
                    </div>
                    <button onClick={() => { logout(); closeDrawer(); }} className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1.5 shrink-0">Logout</button>
                  </div>
                ) : (
                  <button onClick={() => { closeDrawer(); openAuthModal(); }}
                    className="w-full py-3 bg-[#1A1A1A] text-[#F9F8F6] text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#2B2421] transition-colors"
                  >
                    Login / Register
                  </button>
                )}
              </div>

              {/* Menu items */}
              <div className="flex-1 overflow-y-auto scrollbar-none">
                <div className="px-2 py-2 space-y-0.5">
                  {mobileMenuItems.map((item) => {
                    const subs = getSubcategories(item.label);
                    return (
                      <Link key={item.label} to={item.href}
                        onClick={(e) => { if (subs) { e.preventDefault(); setActiveSubmenu(item.label); } else closeDrawer(); }}
                        className="flex items-center justify-between px-3 py-3 hover:bg-[#EFECE6] transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img src={item.img} alt="" className="w-8 h-8 object-cover rounded-full border border-[#EFECE6] shrink-0" loading="lazy" />
                          <span className="text-[13px] font-medium text-[#2B2421] group-hover:text-[#1A1A1A]">{item.label}</span>
                        </div>
                        {subs && <ChevronRight size={13} className="text-[#767676]" />}
                      </Link>
                    );
                  })}
                </div>

                {/* Footer links */}
                <div className="px-5 py-4 border-t border-[#EFECE6] space-y-3">
                  <p className="text-[9px] font-bold text-[#767676] uppercase tracking-[0.2em]">Help & Support</p>
                  {[
                    { label: 'About Us', href: '/#about-us' },
                    { label: 'Track Order', href: '/orders' },
                    { label: 'WhatsApp Support', href: `https://wa.me/${WHATSAPP_NUMBER}` },
                    { label: 'Damage Replacement', href: '/damage-replacement' },
                    { label: 'FAQs', href: '/faqs' },
                  ].map((lk) => {
                    const isExt = lk.href.startsWith('http');
                    const cls = 'flex items-center justify-between text-[12px] font-medium text-[#767676] hover:text-[#1A1A1A] transition-colors py-1.5';
                    return isExt ? (
                      <a key={lk.label} href={lk.href} target="_blank" rel="noopener noreferrer" onClick={closeDrawer} className={cls}>
                        <span>{lk.label}</span><ChevronRight size={11} />
                      </a>
                    ) : (
                      <Link key={lk.label} to={lk.href} onClick={closeDrawer} className={cls}>
                        <span>{lk.label}</span><ChevronRight size={11} />
                      </Link>
                    );
                  })}
                  {user?.is_admin && (
                    <Link to="/admin" onClick={closeDrawer} className="flex items-center gap-2 text-[12px] font-semibold text-[#C6A15E] py-1.5">
                      <Settings size={13} /> Admin Panel
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* PANEL 2: Submenu */}
            <div className="w-1/2 h-full flex flex-col shrink-0 bg-[#F9F8F6] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#EFECE6] shrink-0">
                <button onClick={() => setActiveSubmenu(null)} className="flex items-center gap-1 text-[#767676] hover:text-[#1A1A1A] transition-colors">
                  <ChevronLeft size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Back</span>
                </button>
                <button onClick={closeDrawer} className="w-8 h-8 flex items-center justify-center text-[#767676]"><X size={16} strokeWidth={1.5} /></button>
              </div>
              {activeSubmenu && (
                <div className="px-3 py-3 border-b border-[#EFECE6] shrink-0">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1A1A1A]">{activeSubmenu}</h3>
                </div>
              )}
              <div className="flex-1 overflow-y-auto scrollbar-none py-2">
                {activeSubmenu && getSubcategories(activeSubmenu)?.map((sub) => (
                  <Link key={sub.label} to={sub.href} onClick={closeDrawer}
                    className="flex items-center justify-between px-4 py-3 text-[13px] font-medium text-[#2B2421] hover:text-[#1A1A1A] hover:bg-[#EFECE6] transition-colors border-b border-[#EFECE6]/50 last:border-0"
                  >
                    <span>{sub.label}</span>
                    <ChevronRight size={12} className="text-[#767676]" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>}

      {/* suppress unused var warning */}
    </header>
  );
}
