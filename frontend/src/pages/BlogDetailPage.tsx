import { Link, useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useBlogPost, useBlogPosts } from '@/hooks/useBlog';

function formatDate(d?: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug ?? '');
  const { data: related } = useBlogPosts({ category: post?.category, limit: 4 });
  const relatedPosts = related?.items.filter((p) => p.slug !== post?.slug).slice(0, 3) ?? [];

  if (isLoading) {
    return (
      <div style={{ backgroundColor: '#F9F8F6' }}>
        <div className="skeleton-bone w-full h-[360px] sm:h-[480px]" />
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          <div className="skeleton-bone h-10 w-3/4 rounded" />
          <div className="skeleton-bone h-4 w-1/3 rounded" />
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-bone h-4 rounded" />)}
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4" style={{ backgroundColor: '#F9F8F6' }}>
        <p className="font-display text-2xl text-[#1A1A1A]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Article not found
        </p>
        <Link to="/blog" className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#C6A15E] hover:underline">
          ← Back to Journal
        </Link>
      </div>
    );
  }

  return (
    <article style={{ backgroundColor: '#F9F8F6' }}>
      {/* Hero image */}
      <div className="w-full overflow-hidden" style={{ height: 'clamp(280px, 45vw, 520px)' }}>
        <img
          src={post.cover_image_url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1400&h=600&fit=crop&q=80'}
          alt={post.title}
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {/* Article body */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link to="/blog"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-[0.14em] uppercase text-[#767676] hover:text-[#1A1A1A] transition-colors mb-8">
          <ArrowLeft size={12} /> Back to Journal
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {post.category && (
            <span className="text-[10px] font-bold tracking-[0.24em] uppercase text-[#C6A15E]">{post.category}</span>
          )}
          {post.published_at && (
            <span className="text-[12px] text-[#767676] font-body">{formatDate(post.published_at)}</span>
          )}
          <span className="text-[12px] text-[#767676] font-body">by {post.author_name}</span>
        </div>

        <h1 className="text-[2.2rem] sm:text-[2.8rem] leading-[1.08] text-[#1A1A1A] mb-6"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.02em' }}>
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-[16px] text-[#767676] leading-relaxed font-body mb-8 pb-8 border-b border-[#EFECE6] italic">
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div className="prose max-w-none
          prose-headings:font-display prose-headings:text-[#1A1A1A] prose-headings:tracking-wide
          prose-h2:text-2xl prose-h3:text-xl
          prose-p:text-[#767676] prose-p:leading-relaxed prose-p:font-body prose-p:text-[15px]
          prose-li:text-[#767676] prose-li:font-body prose-li:text-[15px]
          prose-strong:text-[#1A1A1A]
          prose-a:text-[#C6A15E] prose-a:no-underline hover:prose-a:underline
          prose-img:border prose-img:border-[#EFECE6]"
        >
          <Markdown>{post.content}</Markdown>
        </div>
      </div>

      {/* Related articles */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-[#EFECE6] py-12 sm:py-16" style={{ backgroundColor: '#EFECE6' }}>
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl text-[#1A1A1A]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>
                More from the Journal
              </h2>
              <Link to="/blog" className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold tracking-[0.14em] uppercase text-[#767676] hover:text-[#1A1A1A] transition-colors">
                All articles <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} to={`/blog/${rp.slug}`}
                  className="group flex flex-col overflow-hidden border border-[#F9F8F6] hover:border-[#C6A15E] transition-colors"
                >
                  <div className="overflow-hidden" style={{ aspectRatio: '3/2' }}>
                    <img src={rp.cover_image_url || ''} alt={rp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  </div>
                  <div className="p-4" style={{ backgroundColor: '#F9F8F6' }}>
                    {rp.category && <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#C6A15E]">{rp.category}</span>}
                    <h3 className="mt-1.5 text-[16px] text-[#1A1A1A] line-clamp-2 group-hover:text-[#C6A15E] transition-colors"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>
                      {rp.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
