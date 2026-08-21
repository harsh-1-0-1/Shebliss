import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <section
      className="min-h-[72vh] flex flex-col items-center justify-center px-4 py-16 text-center"
      style={{ backgroundColor: '#F9F8F6' }}
    >
      {/* Large 404 */}
      <p
        className="leading-none select-none mb-4"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(6rem, 18vw, 14rem)',
          fontWeight: 600,
          color: '#EFECE6',
          letterSpacing: '0.06em',
        }}
      >
        404
      </p>

      <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-3">
        Page not found
      </p>

      <h1
        className="text-3xl sm:text-4xl text-[#1A1A1A] leading-tight max-w-md mb-4"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.02em' }}
      >
        This page has gone somewhere beautiful
      </h1>

      <p className="text-[14px] text-[#767676] font-body max-w-xs leading-relaxed mb-8">
        The page you're looking for is missing, moved, or no longer available. Let's get you back to browsing.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          to="/"
          className="px-8 py-3.5 bg-[#1A1A1A] text-[#F9F8F6] text-[12px] font-bold tracking-[0.16em] uppercase hover:bg-[#2B2421] transition-colors"
        >
          Back to Home
        </Link>
        <Link
          to="/products"
          className="px-8 py-3.5 border border-[#1A1A1A] text-[#1A1A1A] text-[12px] font-bold tracking-[0.16em] uppercase hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors"
        >
          Browse Collection
        </Link>
      </div>

      <button
        onClick={() => window.history.back()}
        className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#767676] hover:text-[#1A1A1A] transition-colors font-body"
      >
        <ArrowLeft size={12} /> Go back
      </button>
    </section>
  );
}
