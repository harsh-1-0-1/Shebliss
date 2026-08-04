import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useBanners } from '@/hooks/useBanners';
import type { Banner } from '@/types';

const FALLBACK_SLIDES: Banner[] = [
  {
    id: 0,
    title: 'Timeless Elegance,\nReimagined.',
    subtitle: 'Handcrafted 18k Gold Plated & Anti-Tarnish Statement Jewellery.',
    cta_text: 'Explore Collection',
    cta_link: '/products',
    image_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1400&h=1000&fit=crop&crop=center&q=85',
    bg_color: '#EFECE6',
    text_color: '#1A1A1A',
    placement: 'hero',
    position: 0,
    is_active: true,
  },
  {
    id: 1,
    title: 'The Bridal\nCollection.',
    subtitle: 'Complete sets crafted for your most important moments.',
    cta_text: 'Shop Bridal',
    cta_link: '/products?category=bridal-sets',
    image_url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1400&h=1000&fit=crop&crop=center&q=85',
    bg_color: '#F9F8F6',
    text_color: '#1A1A1A',
    placement: 'hero',
    position: 1,
    is_active: true,
  },
  {
    id: 2,
    title: 'Gold That\nEndures.',
    subtitle: '18k gold plated. Anti-tarnish base. Hypoallergenic.',
    cta_text: 'Shop Necklaces',
    cta_link: '/products?category=necklaces',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1400&h=1000&fit=crop&crop=center&q=85',
    bg_color: '#EFECE6',
    text_color: '#1A1A1A',
    placement: 'hero',
    position: 2,
    is_active: true,
  },
];

function HeroSkeleton() {
  return (
    <section className="w-full h-[480px] sm:h-[540px] lg:h-[620px] skeleton-bone" />
  );
}

export default function HeroBanner() {
  const { data: banners = [], isLoading } = useBanners('hero');
  const slides = banners.length > 0 ? banners : FALLBACK_SLIDES;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartRef = useRef(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setTimeout(next, 5000);
    return () => clearTimeout(id);
  }, [paused, next, current, slides.length]);

  if (isLoading) return <HeroSkeleton />;

  const slide = slides[current];
  const titleLines = slide.title?.split('\n') ?? [];

  return (
    <section
      className="relative w-full overflow-hidden group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStartRef.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const delta = e.changedTouches[0].clientX - touchStartRef.current;
        if (delta < -50) next();
        else if (delta > 50) prev();
      }}
      style={{ backgroundColor: slide.bg_color || '#EFECE6' }}
    >
      {/* Slide track */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div
            key={s.id ?? i}
            className="w-full shrink-0 relative flex flex-col lg:flex-row"
            style={{ backgroundColor: s.bg_color || '#EFECE6', minHeight: 'clamp(480px, 62vh, 660px)' }}
            aria-hidden={i !== current}
          >
            {/* Left panel — editorial photo (60%) */}
            <div className="relative w-full lg:w-[60%] overflow-hidden" style={{ minHeight: 'clamp(280px, 45vw, 560px)' }}>
              {s.image_url && (
                <img
                  src={s.image_url}
                  alt=""
                  className="w-full h-full object-cover object-center"
                  style={{ position: 'absolute', inset: 0 }}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              )}
              {/* Subtle gradient for text readability on mobile */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent lg:hidden" />
            </div>

            {/* Right panel — typography (40%) */}
            <div
              className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-12 lg:px-14 xl:px-16 py-10 lg:py-0"
              style={{ backgroundColor: s.bg_color || '#EFECE6' }}
            >
              {s.badge_text && (
                <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-4">
                  {s.badge_text}
                </span>
              )}

              <h1
                className="leading-[1.06] tracking-[0.02em]"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 600,
                  fontSize: 'clamp(2.4rem, 4.5vw, 4rem)',
                  color: s.text_color || '#1A1A1A',
                }}
              >
                {titleLines.map((line, li) => (
                  <span key={li} className="block">{line}</span>
                ))}
              </h1>

              {s.subtitle && (
                <p className="mt-5 text-[13px] sm:text-[14px] leading-relaxed text-[#767676] max-w-xs font-body">
                  {s.subtitle}
                </p>
              )}

              {s.cta_text && s.cta_link && (
                <Link
                  to={s.cta_link}
                  className="mt-8 inline-flex items-center gap-3 w-fit px-8 py-3.5 border border-[#1A1A1A] text-[11px] font-bold tracking-[0.18em] uppercase text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors duration-300 group/btn"
                >
                  {s.cta_text}
                  <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              )}

              {/* Slide counter */}
              {slides.length > 1 && (
                <div className="flex items-center gap-3 mt-10">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrent(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={clsx(
                        'transition-all duration-300',
                        idx === current
                          ? 'w-8 h-[2px] bg-[#1A1A1A]'
                          : 'w-3 h-[2px] bg-[#1A1A1A]/25 hover:bg-[#1A1A1A]/50',
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Arrow controls */}
      {slides.length > 1 && (
        <>
          <button onClick={prev} aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 border border-[#1A1A1A]/20 bg-[#F9F8F6]/80 backdrop-blur-sm flex items-center justify-center text-[#1A1A1A] hover:bg-[#F9F8F6] transition-all opacity-0 group-hover:opacity-100 duration-200">
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button onClick={next} aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 border border-[#1A1A1A]/20 bg-[#F9F8F6]/80 backdrop-blur-sm flex items-center justify-center text-[#1A1A1A] hover:bg-[#F9F8F6] transition-all opacity-0 group-hover:opacity-100 duration-200">
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </>
      )}
    </section>
  );
}
