import { Link } from 'react-router-dom';
import { useBanners } from '@/hooks/useBanners';

const FALLBACK_BUBBLES = [
  { label: 'New Arrival', href: '/products?category=new-arrival', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=240&h=240&fit=crop&q=75' },
  { label: 'Ear Ring', href: '/products?category=ear-ring', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=240&h=240&fit=crop&q=75' },
  { label: 'Jumkas', href: '/products?category=jumkas', img: 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=240&h=240&fit=crop&q=75' },
  { label: 'Necklaces Sets', href: '/products?category=necklaces-sets', img: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=240&h=240&fit=crop&q=75' },
  { label: 'Bangles', href: '/products?category=bangles', img: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=240&h=240&fit=crop&q=75' },
  { label: 'Wedding Jewells', href: '/products?category=wedding-jewells', img: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=240&h=240&fit=crop&q=75' },
  { label: 'Chains', href: '/products?category=chains', img: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=240&h=240&fit=crop&q=75' },
  { label: 'Finger Rings', href: '/products?category=finger-rings', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=240&h=240&fit=crop&q=75' },
  { label: 'Gifting.', href: '/products?category=gifting', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=240&h=240&fit=crop&q=75' },
  { label: 'Sale', href: '/products?tags=offers', img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=240&h=240&fit=crop&q=75' },
];

export default function MobileCategoryNav() {
  const { data: banners = [] } = useBanners('menu_banner');
  const bubbles = banners.length > 0
    ? banners.map((b) => ({ label: b.title, href: b.cta_link || '/products', img: b.image_url || '' }))
    : FALLBACK_BUBBLES;

  return (
    <section
      className="w-full py-6 lg:py-10 overflow-x-auto scrollbar-none"
      style={{ backgroundColor: '#F9F8F6' }}
      aria-label="Category shortcuts"
    >
      <div className="flex gap-5 sm:gap-7 px-4 sm:px-6 lg:px-10 xl:px-16 w-max lg:w-full lg:mx-auto lg:flex-wrap lg:justify-center">
        {bubbles.map((b) => (
          <Link
            key={b.label}
            to={b.href}
            className="flex flex-col items-center gap-2.5 sm:gap-3 group shrink-0"
          >
            {/* Circle image */}
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 lg:w-[116px] lg:h-[116px] xl:w-[124px] xl:h-[124px] rounded-full overflow-hidden border-2 border-[#EFECE6] group-hover:border-[#C6A15E] transition-colors duration-300 shadow-sm">
              <img
                src={b.img}
                alt={b.label}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <span className="text-[13px] sm:text-[15px] lg:text-[16px] font-medium text-[#2B2421] text-center tracking-wide leading-tight max-w-[72px] sm:max-w-[110px] lg:max-w-[130px] font-body">
              {b.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
