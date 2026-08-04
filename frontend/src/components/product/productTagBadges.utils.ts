// Utilities extracted from ProductTagBadges.tsx so that file can export
// only components (required for React Fast Refresh / HMR).

export interface TagConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  slug: string;
}

export const ALLOWED_TAGS_MAP: Record<string, TagConfig> = {
  'new-arrival':    { label: 'New Arrival',    bg: '#fce8e8', text: '#7a1515', border: '#f5bcbc', slug: 'new-arrival' },
  'new':            { label: 'New Arrival',    bg: '#fce8e8', text: '#7a1515', border: '#f5bcbc', slug: 'new-arrival' },
  'bestseller':     { label: 'Bestseller',     bg: '#fff3cd', text: '#7a5800', border: '#ffe08a', slug: 'bestseller' },
  'best-seller':    { label: 'Bestseller',     bg: '#fff3cd', text: '#7a5800', border: '#ffe08a', slug: 'bestseller' },
  'trending':       { label: 'Trending',       bg: '#fedfc3', text: '#6b3f17', border: '#f9cb9e', slug: 'trending' },
  'bridal':         { label: 'Bridal',         bg: '#f0d5e8', text: '#5c1f46', border: '#e3bad6', slug: 'bridal' },
  'festive':        { label: 'Festive',        bg: '#f9e4c8', text: '#7a3d0a', border: '#f5c98e', slug: 'festive' },
  'handcrafted':    { label: 'Handcrafted',    bg: '#d5e9f2', text: '#1e3e57', border: '#b3d3e3', slug: 'handcrafted' },
  'limited-edition':{ label: 'Limited Edition',bg: '#e8e0f7', text: '#3b1f7a', border: '#c9baed', slug: 'limited-edition' },
  'limited':        { label: 'Limited Edition',bg: '#e8e0f7', text: '#3b1f7a', border: '#c9baed', slug: 'limited-edition' },
  'gold-plated':    { label: 'Gold Plated',    bg: '#fffbe6', text: '#7a6000', border: '#ffe066', slug: 'gold-plated' },
  'silver':         { label: 'Silver',         bg: '#f0f0f5', text: '#3a3a5c', border: '#d0d0e8', slug: 'silver' },
  'gift-set':       { label: 'Gift Set',       bg: '#cde3b5', text: '#2e4c19', border: '#b1cc96', slug: 'gift-set' },
  'combo':          { label: 'Gift Set',       bg: '#cde3b5', text: '#2e4c19', border: '#b1cc96', slug: 'gift-set' },
};

export function getTagStyle(slug: string) {
  const key = slug.toLowerCase().trim().replace(/\s+/g, '-');
  const config = ALLOWED_TAGS_MAP[key] ?? {
    label: slug,
    bg: '#F3F4F6',
    text: '#6B7280',
    border: '#E5E7EB',
  };
  return { bg: config.bg, text: config.text, border: config.border };
}
