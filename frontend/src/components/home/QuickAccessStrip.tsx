import { Link } from 'react-router-dom';

import { useBanners } from '@/hooks/useBanners';

interface Tile {
  id: number;
  type: 'promo' | 'category';
  label: string;
  link: string;
  image?: string;
  bg?: string;
  textColor?: string;
}

const FALLBACK_TILES: Tile[] = [
  {
    id: -2,
    type: 'category',
    label: 'Jumkas',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    link: '/products?category=jumkas',
  },
  {
    id: -3,
    type: 'category',
    label: 'Choker Sets',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    link: '/products?category=choker-sets',
  },
  {
    id: -4,
    type: 'category',
    label: 'Bridal Sets',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400',
    link: '/products?category=bridal-sets',
  },
  {
    id: -5,
    type: 'category',
    label: 'Mangal Sutra',
    image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400',
    link: '/products?category=mangal-sutra',
  },
  {
    id: -6,
    type: 'category',
    label: 'Bangles',
    image: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=400',
    link: '/products?category=bangles',
  },
  {
    id: -7,
    type: 'category',
    label: 'Mang Tikka',
    image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400',
    link: '/products?category=mang-tikka',
  },
  {
    id: -8,
    type: 'category',
    label: 'Gifting.',
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400',
    link: '/products?category=gifting',
  },
];

function PromoTile({ tile }: { tile: Tile }) {
  return (
    <Link
      to={tile.link}
      className="shrink-0 lg:shrink lg:flex-1 w-[140px] sm:w-[160px] lg:w-auto aspect-square rounded-2xl flex items-center justify-center p-4 transition-all hover:scale-[1.02] shadow-sm hover:shadow-md"
      style={{ backgroundColor: tile.bg }}
    >
      <span
        className="text-lg sm:text-xl lg:text-2xl font-bold italic leading-tight text-center whitespace-pre-line"
        style={{ color: tile.textColor }}
      >
        {tile.label}
      </span>
    </Link>
  );
}

function CategoryTile({ tile }: { tile: Tile }) {
  return (
    <Link
      to={tile.link}
      className="group shrink-0 lg:shrink lg:flex-1 w-[140px] sm:w-[160px] lg:w-auto aspect-square rounded-2xl overflow-hidden relative shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
    >
      <img
        src={tile.image}
        alt={tile.label}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-md px-3 py-2.5 border-t border-brass/30">
        <span className="font-display text-sm text-primary leading-tight block text-center truncate">
          {tile.label}
        </span>
      </div>
    </Link>
  );
}

export default function QuickAccessStrip() {
  const { data: banners = [] } = useBanners('strip');
  
  const tiles: Tile[] = banners.length > 0 
    ? banners.map(b => ({
        id: b.id,
        type: b.image_url ? 'category' : 'promo',
        label: b.title.replace('\\n', '\n'),
        link: b.cta_link || '/products',
        image: b.image_url || undefined,
        bg: b.bg_color,
        textColor: b.text_color,
      }))
    : FALLBACK_TILES;

  return (
    <section className="w-full py-4 sm:py-6">
      <div className="flex gap-2 sm:gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible scrollbar-hide px-4 sm:px-6 lg:px-10 xl:px-16 w-full pb-2 lg:pb-0">
        {tiles.map((tile) =>
          tile.type === 'promo' ? (
            <PromoTile key={tile.id} tile={tile} />
          ) : (
            <CategoryTile key={tile.id} tile={tile} />
          ),
        )}
      </div>
    </section>
  );
}
