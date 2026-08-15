import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/product/ProductCard';
import SkeletonCard from '@/components/ui/SkeletonCard';

type Tab = { label: string; sort: string; tags?: string; href: string };

const TABS: Tab[] = [
  { label: 'New Arrivals', sort: 'newest', href: '/products?sort_by=newest' },
  { label: 'Best Sellers', sort: '', tags: 'best-seller', href: '/products?tags=best-seller' },
  { label: 'Trending', sort: 'popular', href: '/products?sort_by=popular' },
];

export default function FeaturedProductsGrid() {
  const [activeTab, setActiveTab] = useState(0);
  const tab = TABS[activeTab];

  const { data, isLoading } = useProducts({
    sort_by: tab.sort || undefined,
    tags: tab.tags || undefined,
    limit: 10,
  });

  const products = data?.items ?? [];

  return (
    <section className="w-full py-10 sm:py-16" style={{ backgroundColor: '#F9F8F6' }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* Header with tabs */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8 sm:mb-10">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl leading-none text-[#1A1A1A] shrink-0"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.03em' }}
          >
            Our Picks
          </h2>

          {/* Tab switcher */}
          <div className="flex items-center gap-0 border-b border-[#EFECE6]">
            {TABS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2.5 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors relative whitespace-nowrap ${
                  i === activeTab
                    ? 'text-[#1A1A1A]'
                    : 'text-[#767676] hover:text-[#1A1A1A]'
                }`}
              >
                {t.label}
                {i === activeTab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C6A15E]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 sm:mt-10 text-center">
          <Link
            to={tab.href}
            className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#1A1A1A] text-[11px] font-semibold tracking-[0.18em] uppercase text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors duration-300 group/btn"
          >
            View all {tab.label}
            <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
