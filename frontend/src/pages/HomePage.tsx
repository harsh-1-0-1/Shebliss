import ErrorBoundary from '@/components/ui/ErrorBoundary';
import HeroBanner from '@/components/home/HeroBanner';
import TrustValueBar from '@/components/home/TrustValueBar';
import MobileCategoryNav from '@/components/home/MobileCategoryNav';
import CategoryHighlightGrid from '@/components/home/CategoryHighlightGrid';
import EditorialCollection from '@/components/home/EditorialCollection';
import FeaturedProductsGrid from '@/components/home/FeaturedProductsGrid';
import BlogSection from '@/components/home/BlogSection';

export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#F9F8F6' }}>
      {/* Category bubbles — mobile only, above the fold */}
      <div className="lg:hidden">
        <MobileCategoryNav />
      </div>

      {/* Hero — split screen editorial */}
      <ErrorBoundary>
        <HeroBanner />
      </ErrorBoundary>

      {/* Trust bar */}
      <TrustValueBar />

      {/* Category grid */}
      <ErrorBoundary>
        <CategoryHighlightGrid />
      </ErrorBoundary>

      {/* Editorial featured collection */}
      <ErrorBoundary>
        <EditorialCollection />
      </ErrorBoundary>

      {/* Featured products — tabbed new/bestseller/trending */}
      <ErrorBoundary>
        <FeaturedProductsGrid />
      </ErrorBoundary>

      {/* Blog / journal */}
      <ErrorBoundary>
        <BlogSection />
      </ErrorBoundary>
    </div>
  );
}
