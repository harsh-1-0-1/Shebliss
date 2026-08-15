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

function isLightColor(hex?: string) {
  if (!hex) return false;
  const h = hex.replace('#', '');
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
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
  const lightTheme = isLightColor(slide.text_color);

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
            className="w-full shrink-0 relative flex flex-col lg:flex-row overflow-hidden"
            style={{ backgroundColor: s.bg_color || '#EFECE6', minHeight: 'clamp(520px, 84vh, 700px)' }}
            aria-hidden={i !== current}
          >
            {/* Left panel — editorial photo (60%) */}
            <div className="relative w-full lg:w-[60%] overflow-hidden aspect-[4/3] lg:aspect-auto lg:min-h-[clamp(280px,45vw,560px)]">
              {s.image_url && (
                <img
                  src={s.image_url}
                  alt=""
                  className="w-full h-full object-cover object-center"
                  style={{ position: 'absolute', inset: 0 }}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              )}
              {/* Contrast overlay for text readability on mobile */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent lg:hidden" />
            </div>

            {/* Right panel — typography (40%) */}
            <div
              className="w-full lg:w-[40%] flex flex-1 lg:flex-none flex-col justify-center px-4 py-5 sm:px-6 sm:py-6 lg:px-14 xl:px-16 lg:py-0 overflow-hidden"
              style={{ backgroundColor: s.bg_color || '#EFECE6' }}
            >
              {s.badge_text && (
                <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#C6A15E] mb-1.5 lg:mb-4">
                  {s.badge_text}
                </span>
              )}

              <h1
                className="text-[1.75rem] lg:text-[clamp(2.4rem,4.5vw,4rem)] leading-[1.15] lg:leading-[1.06] tracking-[0.02em] mb-2 lg:mb-0"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 600,
                  color: s.text_color || '#1A1A1A',
                }}
              >
                {titleLines.map((line, li) => (
                  <span key={li} className="block">{line}</span>
                ))}
              </h1>

              {s.subtitle && (
                <p className={clsx(
                  'mt-3 lg:mt-5 text-[12px] sm:text-[14px] leading-[1.4] max-w-xs font-body line-clamp-2 lg:line-clamp-none',
                  lightTheme ? 'text-[#F8F4EC]/75' : 'text-[#767676]',
                )}>
                  {s.subtitle}
                </p>
              )}

              {s.cta_text && s.cta_link && (
                <Link
                  to={s.cta_link}
                  className={clsx(
                    'mt-5 lg:mt-8 inline-flex items-center gap-3 w-fit px-[18px] py-[10px] sm:px-8 sm:py-3.5 border text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors duration-300 group/btn',
                    lightTheme
                      ? 'border-[#F8F4EC] text-[#F8F4EC] hover:bg-[#F8F4EC] hover:text-[#1A1A1A]'
                      : 'border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F8F6]',
                  )}
                >
                  {s.cta_text}
                  <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              )}

              {/* Slide counter */}
              {slides.length > 1 && (
                <div className="flex items-center gap-3 mt-8 lg:mt-10">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrent(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={clsx(
                        'transition-all duration-300',
                        idx === current
                          ? `w-8 h-[2px] ${lightTheme ? 'bg-[#F8F4EC]' : 'bg-[#1A1A1A]'}`
                          : `w-3 h-[2px] ${lightTheme ? 'bg-[#F8F4EC]/25 hover:bg-[#F8F4EC]/50' : 'bg-[#1A1A1A]/25 hover:bg-[#1A1A1A]/50'}`,
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
