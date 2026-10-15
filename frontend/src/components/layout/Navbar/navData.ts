import type { Banner, Category } from '@/types';

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

// Helper to generate category URLs using the new route pattern
function catUrl(slug: string): string {
  return `/category/${slug}`;
}

export const NAV_ITEMS: NavItemDef[] = [
  { label: 'NEW ARRIVAL', href: catUrl('new-arrival') },
  {
    label: 'NECKLACES SETS',
    href: catUrl('necklaces-sets'),
    groups: [
      [
        {
          links: [
            { label: 'Kundan Necklace Sets', href: catUrl('kundan-necklace-sets') },
            { label: 'South Indian Sets', href: catUrl('south-indian-sets') },
            { label: 'Heritage Necklace Sets', href: catUrl('heritage-necklace-sets') },
            { label: 'Antique Jewellery Set', href: catUrl('antique-jewellery-set') },
            { label: 'Pendent Necklace', href: catUrl('pendent-necklace') },
            { label: 'Temple Jewellery', href: catUrl('temple-jewellery') },
          ],
        },
      ],
      [
        {
          links: [
            { label: 'American Diamond Sets', href: catUrl('american-diamond-sets') },
            { label: 'Choker Sets', href: catUrl('choker-sets') },
            { label: 'Long Sets', href: catUrl('long-sets') },
            { label: 'Panchaloha Sets', href: catUrl('panchaloha-sets') },
            { label: 'Simple AD Sets', href: catUrl('simple-ad-sets') },
            { label: 'Combo Sets', href: catUrl('combo-sets') },
          ],
        },
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
    label: 'EAR RING',
    href: catUrl('ear-ring'),
    groups: [
      [
        {
          links: [
            { label: 'Jumkas', href: catUrl('jumkas') },
            { label: 'Chandbalis', href: catUrl('chandbalis') },
            { label: 'Studs', href: catUrl('studs') },
          ],
        },
      ],
      [
        {
          links: [
            { label: 'Danglers', href: catUrl('danglers') },
            { label: 'Balis', href: catUrl('balis') },
            { label: 'Daily Wear', href: catUrl('daily-wear') },
          ],
        },
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
    label: 'BANGLES',
    href: catUrl('bangles'),
    groups: [
      [
        {
          links: [
            { label: 'Set of 2 Bangles', href: catUrl('set-of-2two-bangles') },
            { label: 'Set of 4 Bangles', href: catUrl('set-of-4-bangles') },
            { label: 'Set of 6/12 Bangles', href: catUrl('set-of-6-12-bangles') },
            { label: 'Kada', href: catUrl('kada') },
            { label: 'Bracelet', href: catUrl('bracelet') },
          ],
        },
      ],
    ],
  },
  {
    label: 'CHAINS',
    href: catUrl('chains'),
    groups: [
      [
        {
          links: [
            { label: 'Moppu Chain', href: catUrl('moppu-chain') },
            { label: 'Plain', href: catUrl('plain') },
            { label: 'Pendent', href: catUrl('pendent') },
            { label: 'Beads Chain', href: catUrl('beads-chain') },
            { label: 'Mangal Sutra', href: catUrl('mangal-sutra') },
            { label: 'Karimani Mala', href: catUrl('karimani-mala') },
          ],
        },
      ],
    ],
  },
  {
    label: 'WEDDING JEWELLS',
    href: catUrl('wedding-jewells'),
    groups: [
      [
        {
          links: [
            { label: 'Bridal Sets', href: catUrl('bridal-sets') },
            { label: 'Mang Tikka', href: catUrl('mang-tikka') },
            { label: 'Waist Belt', href: catUrl('waist-belt') },
            { label: 'Vanki Arm Band', href: catUrl('vanki-arm-band') },
          ],
        },
      ],
      [
        {
          links: [
            { label: 'Finger Rings', href: catUrl('wedding-finger-rings') },
            { label: 'Mangal Sutra', href: catUrl('wedding-mangal-sutra') },
            { label: 'Gifting', href: catUrl('gifting') },
          ],
        },
      ],
    ],
  },
  {
    label: 'PANCHA LOHA JEWELLS',
    href: catUrl('pancha-loha-jewells'),
    groups: [
      [
        {
          links: [
            { label: 'Attiga', href: catUrl('attiga') },
            { label: 'Necklace', href: catUrl('necklace') },
            { label: 'Chain', href: catUrl('chain') },
            { label: 'Finger Rings', href: catUrl('finger-rings') },
          ],
        },
      ],
    ],
  },
  { label: 'FESTIVAL PICK', href: catUrl('festival-pick') },
  { label: 'SIGNATURE COLLECTION', href: catUrl('signature-collection') },
  { label: 'BEST SELLERS', href: catUrl('best-sellers') },
  {
    label: 'OTHER JEWELLERY',
    href: catUrl('other-jewellery'),
    groups: [
      [
        {
          links: [
            { label: 'Ethnic Templejewellery', href: catUrl('ethnic-templejewellery') },
            { label: 'Minimal Ethnic Jewellery', href: catUrl('minimal-ethnic-jewellery') },
            { label: 'Bridal Bliss', href: catUrl('bridal-bliss') },
          ],
        },
      ],
    ],
  },
  { label: 'CORPORATE GIFTS', href: '/corporate-gifting' },
  { label: 'BLOG', href: '/blog' },
  { label: 'SHOP BY COLOR', href: '/shop-by-color' },
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
    label: 'New Arrival',
    href: catUrl('new-arrival'),
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Necklaces Sets',
    href: catUrl('necklaces-sets'),
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=280&q=80',
    accent: '#f0e4cf',
  },
  {
    label: 'Ear Ring',
    href: catUrl('ear-ring'),
    image: 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Bangles',
    href: catUrl('bangles'),
    image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=280&q=80',
    accent: '#f0e4cf',
  },
  {
    label: 'Wedding Jewells',
    href: catUrl('wedding-jewells'),
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Chains',
    href: catUrl('chains'),
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=280&q=80',
    accent: '#f0e4cf',
  },
  {
    label: 'Best Sellers',
    href: catUrl('best-sellers'),
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Corporate Gifts',
    href: '/corporate-gifting',
    image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=280&q=80',
    accent: '#d6e5dd',
  },
  {
    label: 'Blog',
    href: '/blog',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Sale',
    href: '/products?tags=offers',
    image: 'https://images.unsplash.com/photo-1560693225-b8507d6f3aa9?w=280&q=80',
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

export function categoryLink(c: Category): string {
  return `/category/${c.slug}`;
}

export function sortByMenuOrder<T extends { sort_order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export const LABEL_TO_NAV: Record<string, NavItemDef | undefined> = {};
for (const item of NAV_ITEMS) {
  const key = item.label.charAt(0) + item.label.slice(1).toLowerCase();
  LABEL_TO_NAV[key] = item;
}
LABEL_TO_NAV['Corporate Gifts'] = NAV_ITEMS.find((n) => n.label === 'CORPORATE GIFTS');
