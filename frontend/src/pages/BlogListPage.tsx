import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlogPosts } from '@/hooks/useBlog';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'News', value: 'NEWS' },
  { label: 'Buying Guides', value: 'GUIDES' },
  { label: 'Style Tips', value: 'TIPS' },
  { label: 'Stories', value: 'STORIES' },
];

function formatDate(d?: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogListPage() {
  const [activeCategory, setActiveCategory] = useState('');
  const { data, isLoading } = useBlogPosts({ category: activeCategory || undefined, limit: 50 });

  return (
    <div style={{ backgroundColor: '#F9F8F6' }}>
      {/* Header */}
      <div className="border-b border-[#EFECE6] py-12 sm:py-16 text-center px-4">
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-3">Journal</p>
        <h1 className="text-4xl sm:text-5xl text-[#1A1A1A] leading-none"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.02em' }}>
          Stories & Style
        </h1>
        <p className="mt-3 text-[13px] text-[#767676] font-body max-w-md mx-auto">
          Styling guides, care rituals and jewellery stories from the Shebliss atelier.
        </p>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 py-10">
        {/* Category filter tabs */}
        <div className="flex items-center gap-0 border-b border-[#EFECE6] mb-8 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-3 text-[11px] font-bold tracking-[0.12em] uppercase whitespace-nowrap relative transition-colors ${
                activeCategory === cat.value ? 'text-[#1A1A1A]' : 'text-[#767676] hover:text-[#1A1A1A]'
              }`}
            >
              {cat.label}
              {activeCategory === cat.value && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C6A15E]" />
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-bone" style={{ aspectRatio: '3/2', height: '280px' }} />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="py-24 text-center">
            <p className="font-display text-2xl text-[#1A1A1A]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              No articles found
            </p>
            <button onClick={() => setActiveCategory('')}
              className="mt-4 text-[11px] font-bold tracking-[0.14em] uppercase text-[#767676] hover:text-[#1A1A1A] underline underline-offset-4 transition-colors">
              Clear filter
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {data.items.map((post, i) => (
              <Link key={post.id} to={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden border border-[#EFECE6] hover:border-[#C6A15E] transition-colors"
              >
                <div className="overflow-hidden" style={{ aspectRatio: '3/2' }}>
                  <img
                    src={post.cover_image_url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=400&fit=crop&q=75'}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading={i < 3 ? 'eager' : 'lazy'}
                  />
                </div>
                <div className="flex flex-col flex-1 p-4 sm:p-5 gap-2" style={{ backgroundColor: '#EFECE6' }}>
                  {post.category && (
                    <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#C6A15E]">{post.category}</span>
                  )}
                  <h3 className="text-[16px] sm:text-[17px] leading-snug text-[#1A1A1A] line-clamp-2 group-hover:text-[#C6A15E] transition-colors"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>
                    {post.title}
                  </h3>
                  <p className="text-[12px] text-[#767676] line-clamp-2 font-body leading-relaxed">{post.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F9F8F6]">
                    <span className="text-[10px] text-[#767676] font-body">{formatDate(post.published_at)}</span>
                    <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#C6A15E]">Read →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
