import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';

const FALLBACK_CATEGORIES = [
  {
    name: 'Earrings',
    slug: 'earrings',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=earrings',
  },
  {
    name: 'Necklaces',
    slug: 'necklaces',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=necklaces',
  },
  {
    name: 'Bangles & Kada',
    slug: 'bangles',
    image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=bangles',
  },
  {
    name: 'Bridal Sets',
    slug: 'bridal-sets',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=bridal-sets',
  },
  {
    name: 'Rings',
    slug: 'rings',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=rings',
  },
  {
    name: 'Mangalsutra & Sets',
    slug: 'mangalsutra',
    // Verified: gold mangalsutra / necklace — NOT vegetables
    image: 'https://images.unsplash.com/photo-1602173574767-37599b9a3be6?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=mangalsutra',
  },
];

interface CatItem {
  name: string;
  slug: string;
  image: string;
  href: string;
}

/** Editorial callout tile that fills the empty grid slot(s) */
function DiscoverCalloutTile() {
  return (
    <Link
      to="/products"
      className="relative group overflow-hidden flex flex-col items-center justify-center w-full h-full"
      style={{
        background: 'linear-gradient(145deg, #2B2421 0%, #1A1A1A 55%, #2e1f10 100%)',
        aspectRatio: '3/2',
        minHeight: '160px',
      }}
    >
      {/* Diagonal gold hatching texture */}
      <div
        className="absolute inset-0 opacity-[0.045] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #C6A15E 0px, #C6A15E 1px, transparent 1px, transparent 9px)',
        }}
      />

      {/* Hover shimmer sweep */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700"
        style={{
          background:
            'linear-gradient(105deg, transparent 30%, rgba(198,161,94,0.08) 50%, transparent 70%)',
        }}
      />

      {/* Top gold rule */}
      <div className="absolute top-4 sm:top-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 w-[80%] justify-center">
        <span className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#C6A15E]/40" />
        <span
          className="text-[7px] font-bold tracking-[0.32em] uppercase text-[#C6A15E]/60 whitespace-nowrap"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.32em' }}
        >
          Shebliss
        </span>
        <span className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#C6A15E]/40" />
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-2.5 px-5 sm:px-7 text-center">
        {/* Decorative diamond */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-70 mb-0.5">
          <rect x="7" y="0.5" width="9.2" height="9.2" rx="0.5" transform="rotate(45 7 0.5)" fill="#C6A15E" fillOpacity="0.25" stroke="#C6A15E" strokeWidth="0.8"/>
        </svg>

        <h3
          className="text-[#F9F8F6] leading-[1.15]"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 500,
            fontSize: 'clamp(1rem, 2vw, 1.55rem)',
            letterSpacing: '0.04em',
          }}
        >
          Discover the<br />Full Collection
        </h3>

        <p className="text-[#F9F8F6]/45 leading-relaxed tracking-wide"
          style={{ fontSize: 'clamp(9px, 1.1vw, 11px)' }}>
          10+ handcrafted jewellery<br />categories to explore
        </p>

        <span
          className="mt-1 inline-flex items-center gap-2 border border-[#C6A15E]/55 text-[#C6A15E] px-3.5 py-1.5 font-bold tracking-[0.18em] uppercase group-hover:bg-[#C6A15E] group-hover:border-[#C6A15E] group-hover:text-[#1A1A1A] transition-all duration-300"
          style={{ fontSize: 'clamp(7px, 0.85vw, 9px)' }}
        >
          View All
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className="group-hover:translate-x-0.5 transition-transform duration-200">
            <path d="M1 5h8M5.5 1.5L9 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      {/* Bottom gold rule */}
      <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 w-[40%] h-[1px] bg-gradient-to-r from-transparent via-[#C6A15E]/35 to-transparent" />
    </Link>
  );
}

function CategoryCard({ cat, tall = false }: { cat: CatItem; tall?: boolean }) {
  return (
    <Link
      to={cat.href}
      className={`relative overflow-hidden group block ${tall ? 'row-span-2' : ''}`}
      style={{ aspectRatio: tall ? '3/4' : undefined }}
    >
      <div className={`relative overflow-hidden ${tall ? 'h-full' : ''}`} style={!tall ? { aspectRatio: '3/4' } : {}}>
        <img
          src={cat.image}
          alt={cat.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=1067&fit=crop&crop=center&q=85';
          }}
        />
        {/* Gradient overlay — stronger for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        {/* Label */}
        <div className="absolute bottom-0 left-0 p-2.5 sm:p-3.5">
          <p
            className="text-[#F9F8F6] leading-none tracking-wide"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 500,
              fontSize: 'clamp(0.85rem, 1.8vw, 1.2rem)',
              letterSpacing: '0.04em',
            }}
          >
            {cat.name}
          </p>
          <span className="mt-1 inline-flex items-center text-[8px] font-bold tracking-[0.2em] uppercase text-[#C6A15E] gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Shop now →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CategoryHighlightGrid() {
  const { data: apiCategories } = useCategories();

  // Build display list from API categories, falling back to hardcoded
  const displayCats: CatItem[] = apiCategories?.length
    ? apiCategories.slice(0, 6).map((c) => ({
        name: c.name,
        slug: c.slug,
        image:
          c.image_url ||
          FALLBACK_CATEGORIES.find((f) => f.slug === c.slug)?.image ||
          FALLBACK_CATEGORIES[0].image,
        href: `/products?category=${c.slug}`,
      }))
    : FALLBACK_CATEGORIES;

  const [first, ...rest] = displayCats;
  // Exactly 4 smaller cards creates a perfect 2×2 grid next to the tall card.
  // This prevents the orphan 5th card that left a blank white gap on the bottom row.
  const shown = rest.slice(0, 4);

  return (
    <section className="w-full py-8 sm:py-12" style={{ backgroundColor: '#F9F8F6' }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* Section header */}
        <div className="mb-6 sm:mb-8 flex items-end justify-between">
          <div>
            <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-2">Browse by category</p>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl leading-none text-[#1A1A1A]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.03em' }}
            >
              Curated for You
            </h2>
          </div>
          <Link
            to="/products"
            className="hidden sm:flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#767676] hover:text-[#1A1A1A] transition-colors"
          >
            View all
          </Link>
        </div>

        {/* Grid: large card left + 2-col right on desktop; 2-col on mobile. */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
          {/* Large feature card — spans 2 rows on all sizes */}
          {first && (
            <div className="col-span-1 row-span-2">
              <Link to={first.href} className="relative overflow-hidden group block h-full" style={{ minHeight: '220px' }}>
                <img
                  src={first.image}
                  alt={first.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  style={{ minHeight: '220px' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=1067&fit=crop&crop=center&q=85';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-3 sm:p-4">
                  <p
                    className="text-[#F9F8F6]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, fontSize: 'clamp(0.9rem, 2vw, 1.3rem)', letterSpacing: '0.04em' }}
                  >
                    {first.name}
                  </p>
                  <span className="mt-1 inline-flex text-[8px] font-bold tracking-[0.2em] uppercase text-[#C6A15E] opacity-0 group-hover:opacity-100 transition-opacity">
                    Shop now →
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* Smaller category cards */}
          {shown.map((cat) => (
            <CategoryCard key={cat.slug} cat={cat} />
          ))}

          {/* Discover callout — full row on mobile, 2 slots on desktop */}
          <div className="col-span-3 sm:col-span-2">
            <DiscoverCalloutTile />
          </div>
        </div>

      </div>
    </section>
  );
}
