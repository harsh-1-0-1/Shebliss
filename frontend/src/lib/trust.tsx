import type { ReactNode } from 'react';
import { RotateCcw, ShieldCheck, Truck, Zap, type LucideIcon } from 'lucide-react';

// Single source of truth for all trust/shipping copy used across the storefront
// (TrustValueBar, TrustFeatureGrid, TrustMarquee). Do not duplicate elsewhere.

export interface TrustValueItem {
  icon: ReactNode;
  label: string;
  sub: string;
}

export const TRUST_ITEMS: TrustValueItem[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
    label: '18k Gold Plated',
    sub: 'Lasting lustre',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z" />
      </svg>
    ),
    label: 'Anti-Tarnish',
    sub: 'Guaranteed finish',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M12 2a6 6 0 0 1 6 6c0 4-6 14-6 14S6 12 6 8a6 6 0 0 1 6-6z" />
        <circle cx="12" cy="8" r="2" />
      </svg>
    ),
    label: 'Hypoallergenic',
    sub: 'Safe for all skin',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" />
        <path d="M7 10c.5-3 5.5-3 6 0 .5 4-6 4-6 8h6" />
      </svg>
    ),
    label: 'Water Resistant',
    sub: 'Sweat & splash proof',
  },
];

export interface TrustFeatureItem {
  icon: LucideIcon;
  label: string;
  sub: string;
}

export const TRUST_FEATURES: TrustFeatureItem[] = [
  { icon: RotateCcw, label: 'COD & Easy Returns', sub: '7-day hassle-free' },
  { icon: Zap, label: 'Express 24h Delivery', sub: 'Metro dispatch' },
  { icon: Truck, label: 'Free Shipping', sub: 'On all orders' },
  { icon: ShieldCheck, label: 'Premium Quality', sub: 'Anti-tarnish finish' },
];

export const TRUST_MARQUEE_MESSAGES = [
  'Free Shipping on all orders',
  'COD & Easy 7-day Returns',
  'Express 24h Delivery',
  'Anti-Tarnish Premium Finish',
  'Trusted by 15,000+ customers',
];