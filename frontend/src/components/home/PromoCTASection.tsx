import { Link } from 'react-router-dom';

import { useBanners } from '@/hooks/useBanners';

const FALLBACK_CARDS = [
  {
    id: -1,
    image_url:
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    title: 'Bundle & Save',
    subtitle:
      'Curated jewellery gift boxes — earrings, chains and bracelets packed in velvet, at a better price.',
    cta_text: 'Start Saving',
    cta_link: '/products?tags=combo',
    text_color: '#A34A2F',
    bg_color: '#0A3B2C',
  },
  {
    id: -2,
    image_url:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80',
    title: 'Corporate & Bulk Gifting',
    subtitle: 'Personalised jewellery sets for your team, clients, and events.',
    cta_text: 'Explore Gifts',
    cta_link: '/products?tags=corporate-gifts',
    text_color: '#A34A2F',
    bg_color: '#0A3B2C',
  },
];

export default function PromoCTASection() {
  const { data: banners = [] } = useBanners('themed');
  const cards = banners.length > 0 ? banners : FALLBACK_CARDS;

  return (
    <section className="w-full py-10 sm:py-14 bg-bg">
      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {cards.map((card) => (
            <Link
              key={card.id}
              to={card.cta_link || '#'}
              className="group relative overflow-hidden rounded-2xl aspect-[4/3] sm:aspect-[5/4] block"
              style={{ backgroundColor: card.bg_color || '#0a3b2c' }}
            >
              {card.image_url && (
                <img
                  src={card.image_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
              <div className="absolute inset-0 p-6 sm:p-9 flex flex-col justify-end">
                <h3 className="font-display text-[clamp(1.5rem,3vw,2.2rem)] leading-tight text-white">
                  {card.title}
                </h3>
                <p className="mt-2 max-w-md text-[12.5px] sm:text-sm font-light leading-relaxed text-white/80">
                  {card.subtitle}
                </p>
                {card.cta_text && (
                  <span className="mt-5 inline-flex w-fit items-center border border-[#d9b36c] px-7 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d9b36c] transition-colors duration-300 group-hover:bg-[#d9b36c] group-hover:text-[#0e4d3a]">
                    {card.cta_text}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
