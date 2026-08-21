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

export const NAV_ITEMS: NavItemDef[] = [
  { label: 'NEW ARRIVAL', href: '/products?category=new-arrival' },
  {
    label: 'NECKLACES SETS',
    href: '/products?category=necklaces-sets',
    groups: [
      [
        {
          links: [
            { label: 'Kundan Necklace Sets', href: '/products?category=kundan-necklace-sets' },
            { label: 'South Indian Sets', href: '/products?category=south-indian-sets' },
            { label: 'Heritage Necklace Sets', href: '/products?category=heritage-necklace-sets' },
            { label: 'Antique Jewellery Set', href: '/products?category=antique-jewellery-set' },
            { label: 'Pendent Necklace', href: '/products?category=pendent-necklace' },
            { label: 'Temple Jewellery', href: '/products?category=temple-jewellery' },
          ],
        },
      ],
      [
        {
          links: [
            { label: 'American Diamond Sets', href: '/products?category=american-diamond-sets' },
            { label: 'Choker Sets', href: '/products?category=choker-sets' },
            { label: 'Long Sets', href: '/products?category=long-sets' },
            { label: 'Panchaloha Sets', href: '/products?category=panchaloha-sets' },
            { label: 'Simple AD Sets', href: '/products?category=simple-ad-sets' },
            { label: 'Combo Sets', href: '/products?category=combo-sets' },
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
    href: '/products?category=ear-ring',
    groups: [
      [
        {
          links: [
            { label: 'Jumkas', href: '/products?category=jumkas' },
            { label: 'Chandbalis', href: '/products?category=chandbalis' },
            { label: 'Studs', href: '/products?category=studs' },
          ],
        },
      ],
      [
        {
          links: [
            { label: 'Danglers', href: '/products?category=danglers' },
            { label: 'Balis', href: '/products?category=balis' },
            { label: 'Daily Wear', href: '/products?category=daily-wear' },
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
    href: '/products?category=bangles',
    groups: [
      [
        {
          links: [
            { label: 'Set of 2 Bangles', href: '/products?category=set-of-2two-bangles' },
            { label: 'Set of 4 Bangles', href: '/products?category=set-of-4-bangles' },
            { label: 'Set of 6/12 Bangles', href: '/products?category=set-of-6-12-bangles' },
            { label: 'Kada', href: '/products?category=kada' },
            { label: 'Bracelet', href: '/products?category=bracelet' },
          ],
        },
      ],
    ],
  },
  {
    label: 'CHAINS',
    href: '/products?category=chains',
    groups: [
      [
        {
          links: [
            { label: 'Moppu Chain', href: '/products?category=moppu-chain' },
            { label: 'Plain', href: '/products?category=plain' },
            { label: 'Pendent', href: '/products?category=pendent' },
            { label: 'Beads Chain', href: '/products?category=beads-chain' },
            { label: 'Mangal Sutra', href: '/products?category=mangal-sutra' },
            { label: 'Karimani Mala', href: '/products?category=karimani-mala' },
          ],
        },
      ],
    ],
  },
  {
    label: 'WEDDING JEWELLS',
    href: '/products?category=wedding-jewells',
    groups: [
      [
        {
          links: [
            { label: 'Bridal Sets', href: '/products?category=bridal-sets' },
            { label: 'Mang Tikka', href: '/products?category=mang-tikka' },
            { label: 'Waist Belt', href: '/products?category=waist-belt' },
            { label: 'Vanki Arm Band', href: '/products?category=vanki-arm-band' },
          ],
        },
      ],
      [
        {
          links: [
            { label: 'Finger Rings', href: '/products?category=wedding-finger-rings' },
            { label: 'Mangal Sutra', href: '/products?category=wedding-mangal-sutra' },
            { label: 'Gifting.', href: '/products?category=gifting' },
          ],
        },
      ],
    ],
  },
  {
    label: 'PANCHA LOHA JEWELLS',
    href: '/products?category=pancha-loha-jewells',
    groups: [
      [
        {
          links: [
            { label: 'Attiga', href: '/products?category=attiga' },
            { label: 'Necklace', href: '/products?category=necklace' },
            { label: 'Chain', href: '/products?category=chain' },
            { label: 'Finger Rings', href: '/products?category=finger-rings' },
          ],
        },
      ],
    ],
  },
  { label: 'FESTIVAL PICK', href: '/products?category=festival-pick' },
  { label: 'SIGNATURE COLLECTION', href: '/products?category=signature-collection' },
  { label: 'BEST SELLERS', href: '/products?category=best-sellers' },
  {
    label: 'OTHER JEWELLERY',
    href: '/products?category=other-jewellery',
    groups: [
      [
        {
          links: [
            { label: 'Ethnic Templejewellery', href: '/products?category=ethnic-templejewellery' },
            { label: 'Minimal Ethnic Jewellery', href: '/products?category=minimal-ethnic-jewellery' },
            { label: 'Bridal Bliss', href: '/products?category=bridal-bliss' },
          ],
        },
      ],
    ],
  },
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
    label: 'New Arrival',
    href: '/products?category=new-arrival',
    image:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Necklaces Sets',
    href: '/products?category=necklaces-sets',
    image:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=280&q=80',
    accent: '#f0e4cf',
  },
  {
    label: 'Ear Ring',
    href: '/products?category=ear-ring',
    image:
      'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Bangles',
    href: '/products?category=bangles',
    image:
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=280&q=80',
    accent: '#f0e4cf',
  },
  {
    label: 'Wedding Jewells',
    href: '/products?category=wedding-jewells',
    image:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=280&q=80',
    accent: '#f3d9cf',
  },
  {
    label: 'Chains',
    href: '/products?category=chains',
    image:
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=280&q=80',
    accent: '#f0e4cf',
  },
  {
    label: 'Best Sellers',
    href: '/products?category=best-sellers',
    image:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=280&q=80',
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

export function categoryLink(c: Category): string {
  return `/products?category=${c.slug}`;
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
