import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCurrencyStore } from '@/store/currencyStore';

const EDITORIAL_IMAGE =
  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=900&h=1200&fit=crop&crop=center&q=85';

export default function EditorialCollection() {
  const { data } = useProducts({ tags: 'best-seller', limit: 3 });
  const { format } = useCurrencyStore();
  const featured = data?.items.slice(0, 2) ?? [];

  return (
    <section className="w-full py-10 sm:py-16 lg:py-20" style={{ backgroundColor: '#EFECE6' }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Left — large editorial photo */}
          <div className="relative overflow-hidden aspect-[3/4] lg:aspect-auto lg:h-[600px] xl:h-[680px]">
            <img
              src={EDITORIAL_IMAGE}
              alt="The Celestial Collection — editorial"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Gold corner accent */}
            <div className="absolute top-5 right-5 w-16 h-16 border border-[#C6A15E]/40" style={{ borderTopWidth: '1px', borderRightWidth: '1px', borderBottomWidth: 0, borderLeftWidth: 0 }} />
            <div className="absolute bottom-5 left-5 w-16 h-16 border border-[#C6A15E]/40" style={{ borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: '1px', borderLeftWidth: '1px' }} />
          </div>

          {/* Right — copy + product mini-cards */}
          <div className="flex flex-col justify-center gap-6 lg:gap-8 py-4">
            <div>
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-3">
                Featured Collection
              </p>
              <h2
                className="text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.06] text-[#1A1A1A]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.02em' }}
              >
                The Celestial<br />Collection
              </h2>
              <p className="mt-4 text-[14px] text-[#767676] leading-relaxed max-w-sm font-body">
                Each piece is designed to move with you — lightweight, enduring, and finished to feel like a family heirloom.
                Crafted on an 18k gold plated anti-tarnish base.
              </p>
            </div>

            {/* Mini product cards */}
            {featured.length > 0 && (
              <div className="space-y-3">
                {featured.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.slug}`}
                    className="flex items-center gap-4 p-3 bg-[#F9F8F6] group hover:bg-white transition-colors"
                  >
                    <img
                      src={p.images?.[0]}
                      alt={p.name}
                      className="w-16 h-16 object-cover shrink-0 bg-[#EFECE6]"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[14px] text-[#1A1A1A] line-clamp-1 group-hover:text-[#C6A15E] transition-colors"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                      >
                        {p.name}
                      </p>
                      <p className="text-[12px] text-[#767676] mt-0.5 font-body">{format(p.price)}</p>
                    </div>
                    <ArrowRight size={14} className="text-[#C6A15E] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}

            <Link
              to="/products?tags=best-seller"
              className="inline-flex items-center gap-3 w-fit px-8 py-3.5 bg-[#1A1A1A] text-[#F9F8F6] text-[11px] font-semibold tracking-[0.18em] uppercase hover:bg-[#2B2421] transition-colors group/btn"
            >
              Shop the Collection
              <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
