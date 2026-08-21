import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

const FALLBACK_CATEGORIES = [
  {
    name: 'Ear Ring',
    slug: 'ear-ring',
    image: 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=ear-ring',
  },
  {
    name: 'Necklaces Sets',
    slug: 'necklaces-sets',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=necklaces-sets',
  },
  {
    name: 'Bangles',
    slug: 'bangles',
    image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=bangles',
  },
  {
    name: 'Wedding Jewells',
    slug: 'wedding-jewells',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=wedding-jewells',
  },
  {
    name: 'Chains',
    slug: 'chains',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=chains',
  },
  {
    name: 'Best Sellers',
    slug: 'best-sellers',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=best-sellers',
  },
];

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1067&fit=crop&crop=center&q=85';

interface CatItem {
  name: string;
  slug: string;
  image: string;
  href: string;
}

function CategoryCard({ cat }: { cat: CatItem }) {
  return (
    <Link
      to={cat.href}
      className="relative overflow-hidden group block bg-card"
      style={{ aspectRatio: '3/4' }}
    >
      <img
        src={cat.image}
        alt={cat.name}
        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
        }}
      />
      {/* Gradient overlay — stronger for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
      {/* Label */}
      <div className="absolute bottom-0 left-0 p-3 sm:p-4">
        <p
          className="text-[#F9F8F6] leading-none tracking-wide"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 500,
            fontSize: 'clamp(1rem, 1.8vw, 1.3rem)',
            letterSpacing: '0.04em',
          }}
        >
          {cat.name}
        </p>
        <span className="mt-1.5 inline-flex items-center text-[9px] font-bold tracking-[0.2em] uppercase text-[#C6A15E] gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Shop now →
        </span>
      </div>
    </Link>
  );
}

export default function CategoryHighlightGrid() {
  const { data: apiCategories } = useCategories();

  const displayCats: CatItem[] = apiCategories?.length
    ? apiCategories.slice(0, 4).map((c) => ({
        name: c.name,
        slug: c.slug,
        image:
          c.image_url ||
          FALLBACK_CATEGORIES.find((f) => f.slug === c.slug)?.image ||
          FALLBACK_IMAGE,
        href: `/products?category=${c.slug}`,
      }))
    : FALLBACK_CATEGORIES.slice(0, 4);

  return (
    <section className="w-full py-10 sm:py-16" style={{ backgroundColor: '#F9F8F6' }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* Section header */}
        <div className="mb-6 sm:mb-10 text-center">
          <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-2">
            Browse by category
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl leading-none text-[#1A1A1A]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.03em' }}
          >
            Curated for You
          </h2>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {displayCats.map((cat) => (
            <CategoryCard key={cat.slug} cat={cat} />
          ))}
        </div>

        {/* View all categories — text link */}
        <div className="mt-8 sm:mt-10 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-[#1A1A1A] hover:text-rust transition-colors group/btn"
          >
            View all categories
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}