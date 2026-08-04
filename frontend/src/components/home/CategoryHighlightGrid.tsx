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
    name: 'Mangalsutra',
    slug: 'mangalsutra',
    image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=800&h=1067&fit=crop&crop=center&q=85',
    href: '/products?category=mangalsutra',
  },
];

interface CatItem {
  name: string;
  slug: string;
  image: string;
  href: string;
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
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
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
  const shown = rest.slice(0, 5); // up to 5 remaining

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

        {/* Grid: large card left + 2×2 right on desktop; 2-col on mobile */}
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
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
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

          {/* Smaller cards */}
          {shown.map((cat) => (
            <CategoryCard key={cat.slug} cat={cat} />
          ))}
        </div>

        {/* Mobile "view all" */}
        <div className="sm:hidden mt-5 text-center">
          <Link to="/products" className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#767676] hover:text-[#1A1A1A] underline underline-offset-4 transition-colors">
            View all categories
          </Link>
        </div>
      </div>
    </section>
  );
}
