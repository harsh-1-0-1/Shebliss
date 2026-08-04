import type { Banner } from '@/types';

export interface DropdownLink {
  label: string;
  href: string;
}

export interface DropdownGroup {
  title?: string;
  links: DropdownLink[];
}

export interface NavItemDef {
  label: string;
  href: string;
  highlight?: boolean;
  groups?: DropdownGroup[][];
}

export const NAV_ITEMS: NavItemDef[] = [
  {
    label: 'EARRINGS',
    href: '/products?category=earrings',
    groups: [
      [
        {
          links: [
            { label: 'Jhumkas', href: '/products?category=jhumkas' },
            { label: 'Studs', href: '/products?category=studs' },
            { label: 'Drops & Dangles', href: '/products?category=drops-dangles' },
            { label: 'Chandbalis', href: '/products?category=chandbalis' },
          ],
        },
      ],
      [
        {
          title: 'Shop by Occasion',
          links: [
            { label: 'Bridal', href: '/products?tags=bridal' },
            { label: 'Daily Wear', href: '/products?tags=daily-wear' },
            { label: 'Festive', href: '/products?tags=festive' },
          ],
        },
      ],
    ],
  },
  {
    label: 'NECKLACES',
    href: '/products?category=necklaces',
    groups: [
      [
        {
          links: [
            { label: 'Chokers', href: '/products?category=chokers' },
            { label: 'Chains', href: '/products?category=chains' },
            { label: 'Rani Haars', href: '/products?category=rani-haars' },
            { label: 'Pendants', href: '/products?category=pendants' },
          ],
        },
      ],
      [
        {
          title: 'Shop by Style',
          links: [
            { label: 'Kundan', href: '/products?tags=kundan' },
            { label: 'Polki', href: '/products?tags=polki' },
            { label: 'Antique', href: '/products?tags=antique' },
          ],
        },
      ],
    ],
  },
  {
    label: 'BANGLES & KADA',
    href: '/products?category=bangles',
    groups: [
      [
        {
          links: [
            { label: 'Bangles', href: '/products?category=bangles' },
            { label: 'Kadas', href: '/products?category=kadas' },
            { label: 'Bracelets', href: '/products?category=bracelets' },
          ],
        },
      ],
    ],
  },
  {
    label: 'BRIDAL',
    href: '/products?category=bridal-sets',
    groups: [
      [
        {
          links: [
            { label: 'Bridal Sets', href: '/products?category=bridal-sets' },
            { label: 'Maang Tikkas', href: '/products?category=maang-tikkas' },
            { label: 'Nath & Nose Pins', href: '/products?category=nath-nose-pins' },
            { label: 'Hair Accessories', href: '/products?category=hair-accessories' },
          ],
        },
      ],
    ],
  },
  {
    label: 'MANGALSUTRA & SETS',
    href: '/products?category=mangalsutra',
    groups: [
      [
        {
          links: [
            { label: 'Mangalsutras', href: '/products?category=mangalsutra' },
            { label: 'Necklace Sets', href: '/products?category=necklace-sets' },
            { label: 'Temple Jewellery', href: '/products?category=temple-jewellery' },
            { label: 'Rings', href: '/products?category=rings' },
          ],
        },
      ],
    ],
  },
  { label: 'GIFT SETS', href: '/products?tags=combo' },
  { label: 'CORPORATE GIFTS', href: '/corporate-gifting' },
  { label: 'BLOG', href: '/blog' },
  { label: 'SALE', href: '/products?tags=offers', highlight: true },
];

export const WHATSAPP_NUMBER = '917083883105';

export interface MobileCollection {
  label: string;
  href: string;
  image: string;
  accent: string;
}

export const MOBILE_COLLECTIONS: MobileCollection[] = [
  {
    label: 'Earrings',
    href: '/products?category=earrings',
    image:
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Necklaces',
    href: '/products?category=necklaces',
    image:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=280&q=80',
    accent: '#f0e4cf',
  },
  {
    label: 'Bangles & Kada',
    href: '/products?category=bangles',
    image:
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Bridal',
    href: '/products?category=bridal-sets',
    image:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=280&q=80',
    accent: '#f0e4cf',
  },
  {
    label: 'Mangalsutra & Sets',
    href: '/products?category=mangalsutra',
    image:
      'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Gift Sets',
    href: '/products?tags=combo',
    image:
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Corporate Gifts',
    href: '/corporate-gifting',
    image:
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=280&q=80',
    accent: '#d6e5dd',
  },
  {
    label: 'Blog',
    href: '/blog',
    image:
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Sale',
    href: '/products?tags=offers',
    image:
      'https://images.unsplash.com/photo-1560693225-b8507d6f3aa9?w=280&q=80',
    accent: '#f0e4cf',
  },
];

export function bannerToCollection(b: Banner): MobileCollection {
  return {
    label: b.title,
    href: b.cta_link || '/products',
    image: b.image_url || '',
    accent: b.bg_color || '#f3d9cf',
  };
}

export const LABEL_TO_NAV: Record<string, NavItemDef | undefined> = {};
for (const item of NAV_ITEMS) {
  const key = item.label.charAt(0) + item.label.slice(1).toLowerCase();
  LABEL_TO_NAV[key] = item;
}
LABEL_TO_NAV['Corporate Gifts'] = NAV_ITEMS.find((n) => n.label === 'CORPORATE GIFTS');
