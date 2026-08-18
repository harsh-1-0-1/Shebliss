import ErrorBoundary from '@/components/ui/ErrorBoundary';
import HeroBanner from '@/components/home/HeroBanner';
import TrustValueBar from '@/components/home/TrustValueBar';
import TrustMarquee from '@/components/home/TrustMarquee';
import MobileCategoryNav from '@/components/home/MobileCategoryNav';
import CategoryHighlightGrid from '@/components/home/CategoryHighlightGrid';
import EditorialCollection from '@/components/home/EditorialCollection';
import FeaturedProductsGrid from '@/components/home/FeaturedProductsGrid';
import StyleInspiration from '@/components/home/StyleInspiration';
import HomeCollectionBlocks from '@/components/home/HomeCollectionBlocks';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import BlogSection from '@/components/home/BlogSection';

export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#F9F8F6' }}>
      {/* Category bubbles — above the hero on all breakpoints */}
      <MobileCategoryNav />

      {/* Hero — split screen editorial */}
      <ErrorBoundary>
        <HeroBanner />
      </ErrorBoundary>

      {/* Trust bar */}
      <TrustValueBar />

      {/* Featured products — tabbed new/bestseller/trending */}
      <ErrorBoundary>
        <FeaturedProductsGrid />
      </ErrorBoundary>

      {/* Category grid */}
      <ErrorBoundary>
        <CategoryHighlightGrid />
      </ErrorBoundary>

      {/* Editorial featured collection */}
      <ErrorBoundary>
        <EditorialCollection />
      </ErrorBoundary>

      {/* Repeated collection banner + slidable product bar blocks (admin-editable) */}
      <ErrorBoundary>
        <HomeCollectionBlocks />
      </ErrorBoundary>

      {/* Style inspiration reels — mood/lifestyle videos from the Stories system */}
      <ErrorBoundary>
        <StyleInspiration />
      </ErrorBoundary>

      {/* Testimonials — customer love */}
      <ErrorBoundary>
        <TestimonialsSection />
      </ErrorBoundary>

      {/* Blog / journal */}
      <ErrorBoundary>
        <BlogSection />
      </ErrorBoundary>

      {/* Trust marquee — above footer */}
      <TrustMarquee />
    </div>
  );
}
