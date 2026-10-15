import { Link } from 'react-router-dom';
import { useColorFamilies } from '@/hooks/useColorFamilies';
import { colourUrl } from '@/lib/urls';

function ColorCircleSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#EFECE6] animate-pulse" />
      <div className="w-14 h-3 bg-[#EFECE6] rounded animate-pulse" />
    </div>
  );
}

export default function ShopByColorPage() {
  const { data: colors = [], isLoading } = useColorFamilies();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F6' }}>
      {/* SEO — React 19 hoists these into <head> */}
      <title>Shop by Color | Shebliss</title>
      <meta
        name="description"
        content="Explore our jewellery collection by colour. Find emerald, ruby, rani pink, ivory and more."
      />

      {/* Page header */}
      <div className="py-8 md:py-12 px-4 text-center">
        <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-[#C6A15E] mb-2">
          Collections
        </p>
        <h1
          className="text-3xl md:text-4xl text-[#1A1A1A] leading-none mb-3"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
        >
          Shop by Colour
        </h1>
        <p className="text-[#767676] text-sm md:text-base max-w-md mx-auto">
          Find jewellery that matches your palette. Click any colour to explore the collection.
        </p>
      </div>

      {/* Color grid */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 md:gap-8">
            {Array.from({ length: 15 }).map((_, i) => (
              <ColorCircleSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 md:gap-8">
            {colors.map((color) => (
              <Link
                key={color.slug}
                to={colourUrl(color.slug)}
                className="group flex flex-col items-center"
              >
                {/* Circle swatch */}
                <div
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-transparent group-hover:border-[#C6A15E] transition-all duration-300 shadow-sm group-hover:shadow-md"
                  style={{ backgroundColor: color.hex }}
                  aria-label={color.label}
                />
                <span className="mt-3 text-[13px] md:text-sm font-medium text-[#2B2421] text-center group-hover:text-[#C6A15E] transition-colors leading-snug">
                  {color.label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
