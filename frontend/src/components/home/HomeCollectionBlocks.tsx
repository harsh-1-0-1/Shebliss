import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBanners } from '@/hooks/useBanners';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/product/ProductCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import type { Banner } from '@/types';
import OptimizedImage from '@/components/common/OptimizedImage';

function CollectionBlock({ banner }: { banner: Banner }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useProducts({
    tags: banner.products_tag || undefined,
    limit: 12,
  });
  const products = data?.items ?? [];
  const total = data?.total ?? products.length;
  const viewAllLink = banner.cta_link || (banner.products_tag ? `/products?tags=${encodeURIComponent(banner.products_tag)}` : '/products');

  const scrollByCards = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-slide-card]');
    const amount = card ? card.offsetWidth + 16 : 280;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <section className="w-full py-10 sm:py-16" style={{ backgroundColor: '#F9F8F6' }}>
      {/* Banner ad — full bleed */}
      {banner.image_url && (
        <Link
          to={banner.cta_link || '/products'}
          className="group relative block w-full overflow-hidden bg-[#14342B]"
          style={{ aspectRatio: '16/7', minHeight: '220px' }}
        >
          <OptimizedImage
            src={banner.image_url}
            sizes="100vw"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
          <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-10 lg:px-14 max-w-2xl">
            {banner.badge_text && (
              <span className="w-fit text-[11px] sm:text-[12px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-2 sm:mb-3">
                {banner.badge_text}
              </span>
            )}
            {banner.subtitle && (
              <h3
                className="text-[#F9F8F6] leading-tight"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 500,
                  fontSize: 'clamp(1.4rem, 3.4vw, 2.8rem)',
                  letterSpacing: '0.02em',
                }}
              >
                {banner.subtitle}
              </h3>
            )}
            {banner.cta_text && (
              <span className="mt-4 sm:mt-6 inline-flex items-center gap-2 w-fit px-5 sm:px-7 py-2.5 sm:py-3 text-[12px] sm:text-[13px] font-semibold tracking-[0.18em] uppercase bg-rust text-bone hover:bg-[#a84326] transition-colors group/btn">
                {banner.cta_text}
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </span>
            )}
          </div>
        </Link>
      )}

      {/* Sliding product bar */}
      {banner.products_tag && products.length > 0 && (
        <div className={`mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 ${banner.image_url ? 'mt-8 sm:mt-10' : ''}`}>
          <div className="flex items-end justify-between gap-5 mb-5 sm:mb-7">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl leading-none text-[#1A1A1A]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.03em' }}
            >
              {banner.title}
            </h2>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => scrollByCards(-1)}
                  aria-label="Scroll left"
                  className="w-9 h-9 border border-[#1A1A1A]/20 flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors"
                >
                  <ChevronLeft size={16} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => scrollByCards(1)}
                  aria-label="Scroll right"
                  className="w-9 h-9 border border-[#1A1A1A]/20 flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors"
                >
                  <ChevronRight size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex gap-3 sm:gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[44vw] sm:w-52 lg:w-56 xl:w-60 shrink-0">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : (
            <div
              ref={trackRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2"
            >
              {products.map((p) => (
                <div
                  key={p.id}
                  data-slide-card
                  className="snap-start shrink-0 w-[44vw] sm:w-52 lg:w-56 xl:w-60"
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center mt-6 sm:mt-8">
            <Link
              to={viewAllLink}
              className="inline-flex items-center gap-2 px-7 py-3 text-[12px] sm:text-[13px] font-semibold tracking-[0.16em] uppercase bg-[#14342B] text-bone hover:bg-[#0e261f] transition-colors"
            >
              View all {total} products
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export default function HomeCollectionBlocks() {
  const { data: banners = [], isLoading } = useBanners('home_collection');

  if (isLoading) return null;
  if (banners.length === 0) return null;

  return (
    <>
      {banners.map((b) => (
        <CollectionBlock key={b.id} banner={b} />
      ))}
    </>
  );
}