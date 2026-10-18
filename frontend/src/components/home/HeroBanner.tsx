import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useBanners } from '@/hooks/useBanners';
import OptimizedImage from '@/components/common/OptimizedImage';

function HeroSkeleton() {
  return (
    <section className="w-full aspect-[4/3] sm:aspect-[16/7] lg:aspect-[21/8] skeleton-bone" />
  );
}

export default function HeroBanner() {
  const { data: banners = [], isLoading } = useBanners('hero');
  const slides = banners;

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
  if (slides.length === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden group bg-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStartRef.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const delta = e.changedTouches[0].clientX - touchStartRef.current;
        if (delta < -50) next();
        else if (delta > 50) prev();
      }}
    >
      {/* Slide track */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div
            key={s.id ?? i}
            className="w-full shrink-0 relative overflow-hidden aspect-[4/3] sm:aspect-[16/7] lg:aspect-[21/8]"
            aria-hidden={i !== current}
          >
            {s.image_url ? (
              <OptimizedImage
                src={s.image_url}
                alt={s.title || ''}
                sizes="100vw"
                className="w-full h-full object-cover object-center"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
              />
            ) : (
              <div className="w-full h-full" style={{ backgroundColor: s.bg_color || '#14342B' }} />
            )}
          </div>
        ))}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={clsx(
                'transition-all duration-300',
                idx === current
                  ? 'w-8 h-[3px] bg-white shadow'
                  : 'w-3 h-[3px] bg-white/40 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      )}

      {/* Arrow controls */}
      {slides.length > 1 && (
        <>
          <button onClick={prev} aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 border border-white/25 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100 duration-200">
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button onClick={next} aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 border border-white/25 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100 duration-200">
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </>
      )}
    </section>
  );
}