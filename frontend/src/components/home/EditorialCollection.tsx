import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBanners } from '@/hooks/useBanners';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/product/ProductCard';
import SkeletonCard from '@/components/ui/SkeletonCard';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=900&h=1200&fit=crop&crop=center&q=85';

function splitTitle(title: string) {
  return title.split(/[\n|]/).map((t) => t.trim()).filter(Boolean);
}

export default function EditorialCollection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { data: banners = [] } = useBanners('editorial');
  const banner = banners[0];

  const { data, isLoading } = useProducts({
    tags: banner?.products_tag || 'best-seller',
    limit: 8,
  });
  const products = data?.items ?? [];

  const titleLines = splitTitle(banner?.title || 'The Celestial|Collection');
  const scrollByCards = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-slide-card]');
    const amount = card ? card.offsetWidth + 16 : 280;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <section className="w-full py-10 sm:py-16 lg:py-20" style={{ backgroundColor: banner?.bg_color || '#EFECE6' }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Left — large editorial photo */}
          <div className="relative overflow-hidden aspect-[3/4] lg:aspect-auto lg:h-[600px] xl:h-[680px]">
            <img
              src={banner?.image_url || DEFAULT_IMAGE}
              alt={banner?.title || 'Featured collection'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Gold corner accent */}
            <div className="absolute top-5 right-5 w-16 h-16 border border-[#C6A15E]/40" style={{ borderTopWidth: '1px', borderRightWidth: '1px', borderBottomWidth: 0, borderLeftWidth: 0 }} />
            <div className="absolute bottom-5 left-5 w-16 h-16 border border-[#C6A15E]/40" style={{ borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: '1px', borderLeftWidth: '1px' }} />
          </div>

          {/* Right — copy + CTA */}
          <div className="flex flex-col justify-center gap-6 lg:gap-8 py-4">
            <div>
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-3">
                {banner?.badge_text || 'Featured Collection'}
              </p>
              <h2
                className="text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.06] text-[#1A1A1A]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.02em', color: banner?.text_color || '#1A1A1A' }}
              >
                {titleLines.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < titleLines.length - 1 && <br />}
                  </span>
                ))}
              </h2>
              <p className="mt-4 text-[14px] text-[#767676] leading-relaxed max-w-sm font-body">
                {banner?.subtitle ||
                  'Each piece is designed to move with you — lightweight, enduring, and finished to feel like a family heirloom. Crafted on an 18k gold plated anti-tarnish base.'}
              </p>
            </div>

            <Link
              to={banner?.cta_link || '/products?tags=best-seller'}
              className="inline-flex items-center gap-3 w-fit px-8 py-3.5 bg-[#1A1A1A] text-[#F9F8F6] text-[11px] font-semibold tracking-[0.18em] uppercase hover:bg-[#2B2421] transition-colors group/btn"
            >
              {banner?.cta_text || 'Shop the Collection'}
              <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Sliding product bar */}
      <div className="mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 mt-8 sm:mt-10">
        <div className="flex items-end justify-between gap-5 mb-5 sm:mb-7">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl leading-none text-[#1A1A1A]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.03em', color: banner?.text_color || '#1A1A1A' }}
          >
            {banner?.title || 'The Celestial Collection'}
          </h2>
          <div className="flex items-center gap-3">
            <Link
              to={banner?.cta_link || '/products?tags=best-seller'}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.14em] uppercase text-[#767676] hover:text-[#1A1A1A] transition-colors"
            >
              View all
            </Link>
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
      </div>
    </section>
  );
}
