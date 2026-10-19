import { Link } from 'react-router-dom';
import { useBanners } from '@/hooks/useBanners';
import OptimizedImage from '@/components/common/OptimizedImage';
import { useCategories } from '@/hooks/useCategories';
import { categoryLink, sortByMenuOrder } from '@/components/layout/Navbar/navData';

export default function MobileCategoryNav() {
  const { data: banners = [] } = useBanners('menu_banner');
  const { data: categories = [] } = useCategories();
  const bubbles = banners.length > 0
    ? banners.map((b) => ({ label: b.title, href: b.cta_link || '/products', img: b.image_url || '' }))
    : sortByMenuOrder(categories).map((c) => ({ label: c.name, href: categoryLink(c), img: c.image_url || '' }));

  if (bubbles.length === 0) return null;

  return (
    <section
      className="w-full py-5 lg:py-6 overflow-x-auto scrollbar-none"
      style={{ backgroundColor: '#F9F8F6' }}
      aria-label="Category shortcuts"
    >
      <div className="flex gap-5 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-10 xl:px-16 w-max min-w-full lg:justify-center">
        {bubbles.map((b) => (
          <Link
            key={b.label}
            to={b.href}
            className="flex flex-col items-center gap-2 group shrink-0"
          >
            {/* Circle image */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-[88px] lg:h-[88px] rounded-full overflow-hidden border-2 border-[#EFECE6] group-hover:border-[#C6A15E] transition-colors duration-300 shadow-sm">
              {b.img && (
                <OptimizedImage
                  src={b.img}
                  widths={[400]}
                  sizes="88px"
                  alt={b.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              )}
            </div>
            <span className="text-[12px] sm:text-[13px] lg:text-[14px] font-medium text-[#2B2421] text-center tracking-wide leading-tight max-w-[72px] sm:max-w-[96px] lg:max-w-[110px] font-body">
              {b.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
