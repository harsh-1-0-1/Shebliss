import { Link, useParams } from 'react-router-dom';
import { useColorFamilies } from '@/hooks/useColorFamilies';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/product/ProductCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { shopByColorUrl } from '@/lib/urls';

export default function ColourProductsPage() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch canonical color info from the backend — not hardcoded
  const { data: colorFamilies = [], isLoading: colorsLoading } = useColorFamilies();
  const colorInfo = colorFamilies.find((c) => c.slug === slug);

  const { data, isLoading: productsLoading } = useProducts({
    colors: slug || undefined,
    limit: 48,
  });

  const isLoading = colorsLoading || productsLoading;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  // Unknown slug after colors have loaded
  const notFound = !colorsLoading && !colorInfo;

  if (notFound) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#F9F8F6' }}
      >
        {/* noindex for unknown colour slugs */}
        <meta name="robots" content="noindex" />

        <div className="text-center px-4">
          <h1
            className="text-2xl text-[#1A1A1A] mb-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Colour Not Found
          </h1>
          <p className="text-[#767676] text-sm mb-6">
            We don't carry that colour — try browsing all colours below.
          </p>
          <Link
            to={shopByColorUrl()}
            className="inline-block px-7 py-3 bg-[#1A1A1A] text-[#F9F8F6] text-[12px] font-bold tracking-[0.14em] uppercase hover:bg-[#C6A15E] transition-colors"
          >
            Browse All Colours
          </Link>
        </div>
      </div>
    );
  }

  const label = colorInfo?.label ?? '';
  const hex = colorInfo?.hex ?? '#C6A15E';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F6' }}>
      {/* SEO — React 19 hoists into <head>. Indexable single-colour pages. */}
      <title>{label} Jewellery | Shebliss</title>
      <meta
        name="description"
        content={`Shop our collection of ${label.toLowerCase()} jewellery. Handpicked pieces in ${label.toLowerCase()} tones.`}
      />
      <link rel="canonical" href={`/colour/${slug}`} />

      {/* Page header */}
      <div className="py-8 md:py-12 px-4 text-center">
        {colorInfo && (
          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full border border-[#EFECE6] shadow-sm"
              style={{ backgroundColor: hex }}
              aria-hidden="true"
            />
            <h1
              className="text-3xl md:text-4xl text-[#1A1A1A] leading-none"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              {label} Jewellery
            </h1>
          </div>
        )}

        {isLoading ? (
          <div className="w-24 h-4 bg-[#EFECE6] rounded animate-pulse mx-auto" />
        ) : (
          <p className="text-[#767676] text-sm">
            {total} {total === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <nav className="text-[12px] text-[#767676] flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#C6A15E] transition-colors">Home</Link>
          <span>/</span>
          <Link to={shopByColorUrl()} className="hover:text-[#C6A15E] transition-colors">
            Shop by Colour
          </Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">{label}</span>
        </nav>
      </div>

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4 text-center">
            <p
              className="text-xl text-[#1A1A1A]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              No products found in {label}
            </p>
            <p className="text-[#767676] text-sm">
              We haven't tagged any pieces with this colour yet. Check back soon.
            </p>
            <Link
              to={shopByColorUrl()}
              className="mt-2 px-7 py-3 border border-[#1A1A1A] text-[12px] font-bold tracking-[0.14em] uppercase hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors"
            >
              Browse Other Colours
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
