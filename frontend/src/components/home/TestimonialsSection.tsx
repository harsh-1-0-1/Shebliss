import { Star } from 'lucide-react';

import { useTestimonials } from '@/hooks/useTestimonials';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          fill={i < rating ? '#D4AF37' : 'none'}
          stroke={i < rating ? '#D4AF37' : '#D8D2C4'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const { data, isLoading } = useTestimonials(6, true);
  const featured = (data || []).filter((t) => t.is_featured && t.is_active).slice(0, 3);

  if (!isLoading && featured.length === 0) return null;

  return (
    <section className="w-full py-10 sm:py-16 bg-white">
      <div className="mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-3">
            Real Reviews From Real Women
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl leading-none text-[#1A1A1A]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.03em' }}
          >
            Loved by 5,000+ Jewelry Lovers
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {featured.map((t) => (
            <figure
              key={t.id}
              className="flex flex-col bg-[#F9F8F6] border border-[#ECE6DC] p-5 sm:p-7 gap-3"
            >
              <Stars rating={t.rating} />
              <blockquote
                className="text-[14px] sm:text-[15px] leading-relaxed text-[#3D3D3D] font-body"
              >
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-auto pt-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[14px] font-semibold text-[#1A1A1A]">{t.name}</p>
                  {t.is_verified && (
                    <p className="text-[11px] font-semibold text-[#15803D] mt-0.5">
                      ✓ Verified Buyer
                    </p>
                  )}
                </div>
                {t.item_purchased && (
                  <span className="text-[11px] text-[#767676] text-right leading-tight pt-1">
                    {t.item_purchased}
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}