import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlog';

const FALLBACK_POSTS = [
  {
    id: 1, slug: 'how-to-style-statement-earrings',
    title: 'How to Style Statement Earrings for Every Occasion',
    excerpt: 'From boardroom to brunch — a guide to wearing bold jewellery with confidence.',
    cover_image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=400&fit=crop&q=80',
    category: 'GUIDES', published_at: '2026-07-15',
  },
  {
    id: 2, slug: 'care-guide-gold-plated-jewellery',
    title: 'The Ultimate Care Guide for Gold Plated Jewellery',
    excerpt: 'Keep your pieces looking pristine with these simple care rituals.',
    cover_image_url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=400&fit=crop&q=80',
    category: 'GUIDES', published_at: '2026-07-01',
  },
  {
    id: 3, slug: 'bridal-jewellery-trends-2026',
    title: 'Bridal Jewellery Trends to Watch in 2026',
    excerpt: 'Kundan revival, layered sets and minimalist mangalsutras are taking centre stage.',
    cover_image_url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=400&fit=crop&q=80',
    category: 'TIPS', published_at: '2026-06-20',
  },
];

function formatDate(d?: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogSection() {
  const { data } = useBlogPosts({ limit: 3 });
  const posts = (data?.items.length ? data.items : FALLBACK_POSTS).slice(0, 3);

  return (
    <section className="w-full py-10 sm:py-16" style={{ backgroundColor: '#EFECE6' }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-2">From the journal</p>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl leading-none text-[#1A1A1A]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.03em' }}
            >
              Stories & Style
            </h2>
          </div>
          <Link to="/blog" className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold tracking-[0.14em] uppercase text-[#767676] hover:text-[#1A1A1A] transition-colors">
            All articles <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group flex flex-col bg-[#F9F8F6] overflow-hidden"
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: '3/2' }}>
                <img
                  src={post.cover_image_url || ''}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
              <div className="flex flex-col flex-1 p-4 sm:p-5 gap-2">
                {post.category && (
                  <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#C6A15E]">{post.category}</span>
                )}
                <h3
                  className="text-[17px] sm:text-[18px] leading-snug text-[#1A1A1A] line-clamp-2 group-hover:text-[#C6A15E] transition-colors"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                >
                  {post.title}
                </h3>
                <p className="text-[13px] text-[#767676] line-clamp-2 font-body leading-relaxed">{post.excerpt}</p>
                <p className="text-[11px] text-[#767676]/60 font-body mt-auto pt-2">{formatDate(post.published_at)}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Link to="/blog" className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#767676] hover:text-[#1A1A1A] underline underline-offset-4 transition-colors">
            View all articles
          </Link>
        </div>
      </div>
    </section>
  );
}
