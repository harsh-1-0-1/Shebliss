import { useCategories } from '@/hooks/useCategories';
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

export function categoryLink(c: Category): string {
  return `/category/${c.slug}`;
}

export function sortByMenuOrder<T extends { sort_order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

const SITE_NAV_ITEMS: NavItemDef[] = [
  { label: 'Corporate Gifts', href: '/corporate-gifting' },
  { label: 'Blog', href: '/blog' },
  { label: 'Shop by Color', href: '/shop-by-color' },
];

export function buildNavItems(categories: Category[]): NavItemDef[] {
  const categoryItems: NavItemDef[] = sortByMenuOrder(categories).map((root) => {
    const children = sortByMenuOrder(root.children ?? []);
    const half = Math.ceil(children.length / 2);
    const columns = children.length > 6
      ? [children.slice(0, half), children.slice(half)]
      : [children];
    return {
      label: root.name,
      href: categoryLink(root),
      groups: children.length > 0
        ? columns.map((col) => [{ links: col.map((c) => ({ label: c.name, href: categoryLink(c) })) }])
        : undefined,
    };
  });
  return [...categoryItems, ...SITE_NAV_ITEMS];
}

export function useNavItems(): NavItemDef[] {
  const { data: categories = [] } = useCategories();
  return buildNavItems(categories);
}

export const WHATSAPP_NUMBER = '917083883105';

export interface MobileCollection {
  label: string;
  href: string;
  image: string;
  accent: string;
}

export function bannerToCollection(b: Banner): MobileCollection {
  return {
    label: b.title,
    href: b.cta_link || '/products',
    image: b.image_url || '',
    accent: b.bg_color || '#f3d9cf',
  };
}

export function categoryToCollection(c: Category): MobileCollection {
  return {
    label: c.name,
    href: categoryLink(c),
    image: c.image_url || '',
    accent: '#f3d9cf',
  };
}
