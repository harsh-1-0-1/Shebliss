import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useBanners } from '@/hooks/useBanners';
import CurrencySwitcher from '@/components/ui/CurrencySwitcher';

// Dismissed state lives only in sessionStorage so a page refresh always
// shows the bar again. We do NOT use a long-lived cookie anymore.
const SESSION_KEY = 'ann_dismissed';

const FALLBACK_MESSAGES = [
  { title: 'Free Express Shipping on Orders Over ₹999', cta_link: '/products' },
  { title: '18k Gold Plated · Anti-Tarnish Guarantee · Hypoallergenic', cta_link: '/products' },
  { title: 'New Arrivals Every Week — Explore the Collection', cta_link: '/products?sort_by=newest' },
];

const Dot = () => (
  <span className="mx-5 text-[#C6A15E]/50 text-[9px] select-none" aria-hidden>✦</span>
);

export default function AnnouncementBar() {
  const { data: banners = [] } = useBanners('announcement');
  // Only dismissed for the current browser session — refresh always resets it.
  const [visible, setVisible] = useState(
    () => sessionStorage.getItem(SESSION_KEY) !== '1',
  );

  if (!visible) return null;

  const messages = banners.length > 0 ? banners : FALLBACK_MESSAGES;

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  }

  // Pad to at least 4 copies so the marquee is always a seamless closed loop
  // regardless of how many entries the admin has configured (even just 1).
  const MIN_COPIES = 4;
  const copies = Math.ceil(MIN_COPIES / messages.length);
  const loopMessages = Array.from({ length: copies }, () => messages).flat();

  const strip = loopMessages.map((msg, i) => (
    <span key={i} className="inline-flex items-center whitespace-nowrap">
      {i > 0 && <Dot />}
      <Link
        to={msg.cta_link || '/products'}
        className="hover:text-[#C6A15E] transition-colors tracking-[0.16em] text-[11px] sm:text-[12px] font-medium uppercase"
      >
        {msg.title}
      </Link>
    </span>
  ));

  return (
    <div
      className="relative w-full flex items-center overflow-hidden"
      style={{ backgroundColor: '#14342B', height: '36px' }}
    >
      {/* Scrolling text strip — two copies for seamless loop */}
      <div className="flex-1 overflow-hidden">
        <div className="animate-marquee flex items-center whitespace-nowrap text-[#F9F8F6]/80">
          {strip}
          <Dot />
          {strip}
          <Dot />
        </div>
      </div>

      {/* Currency switcher — right side */}
      <div className="shrink-0 border-l border-white/10 pl-3 pr-8 sm:pr-10">
        <CurrencySwitcher variant="compact" />
      </div>

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        aria-label="Close announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={11} />
      </button>
    </div>
  );
}
