import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { APP_NAME } from '@/lib/branding';
import { useAuthStore } from '@/store/authStore';

const COLUMNS = [
  {
    title: 'Collections',
    links: [
      { label: 'Earrings', to: '/products?category=earrings' },
      { label: 'Necklaces', to: '/products?category=necklaces' },
      { label: 'Bangles & Bracelets', to: '/products?category=bangles' },
      { label: 'Bridal Sets', to: '/products?category=bridal-sets' },
      { label: 'Mangalsutra & Sets', to: '/products?category=mangalsutra' },
      { label: 'Gift Sets', to: '/products?tags=combo' },
    ],
  },
  {
    title: 'Shop',
    links: [
      { label: 'New Arrivals', to: '/products?sort_by=newest' },
      { label: 'Trending Now', to: '/products?tags=trending' },
      { label: 'Best Sellers', to: '/products?tags=best-seller' },
      { label: 'Sale', to: '/products?tags=offers' },
      { label: 'Corporate Gifting', to: '/corporate-gifting' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/#about-us' },
      { label: 'Blog', to: '/blog' },
      { label: 'FAQs', to: '/faqs' },
      { label: 'Damage Replacement', to: '/damage-replacement' },
    ],
  },
];

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
}
function FacebookIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>;
}
function YouTubeIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
}
function PinterestIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" /></svg>;
}

const SOCIALS = [
  { Icon: InstagramIcon, href: 'https://instagram.com', label: 'Instagram' },
  { Icon: FacebookIcon, href: 'https://facebook.com', label: 'Facebook' },
  { Icon: YouTubeIcon, href: 'https://youtube.com', label: 'YouTube' },
  { Icon: PinterestIcon, href: 'https://pinterest.com', label: 'Pinterest' },
];

export default function Footer() {
  const { user, openAuthModal } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  function handleTrackOrder() {
    if (user) { navigate('/orders'); }
    else openAuthModal();
  }

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) { setSubscribed(true); setEmail(''); }
  }

  return (
    <footer style={{ backgroundColor: '#14342B', color: '#F9F8F6' }} className="mt-12 sm:mt-20 pb-20 md:pb-0">
      {/* Newsletter band */}
      <div className="border-b border-white/10">
        <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-10 lg:py-12 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <h3 className="font-display text-xl sm:text-2xl tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.06em' }}>
              Join the Inner Circle
            </h3>
            <p className="text-sm text-white/50 mt-1 font-body">Early access, exclusive drops & styling inspiration.</p>
          </div>
          {subscribed ? (
            <p className="text-sm text-[#C6A15E] font-semibold">Thank you — you're on the list ✦</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex w-full max-w-sm gap-0">
              <input
                type="email" required placeholder="Your email address" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/8 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#C6A15E] transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              />
              <button type="submit" className="px-5 py-3 bg-rust text-bone text-xs font-semibold tracking-[0.12em] uppercase hover:bg-[#a84326] transition-colors flex items-center gap-1.5 whitespace-nowrap">
                Subscribe <ArrowRight size={13} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main columns */}
      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-12 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-4">
              <span className="font-display text-2xl tracking-[0.1em] text-[#F9F8F6]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
                {APP_NAME.toUpperCase()}
              </span>
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#C6A15E] mt-0.5">Fine Artificial Jewellery</p>
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-xs">
              Handcrafted 18k gold plated & anti-tarnish statement jewellery — designed to feel heirloom.
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/50 hover:text-[#C6A15E] hover:border-[#C6A15E]/40 transition-colors"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C6A15E] mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((lk) => (
                  <li key={lk.label}>
                    <Link to={lk.to} className="text-sm text-white/50 hover:text-white transition-colors">
                      {lk.label}
                    </Link>
                  </li>
                ))}
                {col.title === 'Company' && (
                  <li>
                    <button onClick={handleTrackOrder} className="text-sm text-white/50 hover:text-white transition-colors text-left">
                      Track Order
                    </button>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved. Thinking Web Technology</span>
          <div className="flex items-center gap-2">
            {['VISA', 'MASTERCARD', 'UPI', 'RAZORPAY'].map((m) => (
              <span key={m} className="px-2 py-0.5 border border-white/10 text-[9px] font-bold tracking-wider">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
