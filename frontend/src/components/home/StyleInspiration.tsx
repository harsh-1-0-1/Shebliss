import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useBanners } from '@/hooks/useBanners';
import { useStories } from '@/hooks/useStories';
import { StoryViewer } from '@/components/stories/StoryViewer';
import type { Story } from '@/types';

const FALLBACK_TITLE = 'Style Inspiration';

function ReelCard({ story, onOpen }: { story: Story; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Autoplay might be blocked by browser policy, ignore quietly
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.4 },
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
      observer.disconnect();
    };
  }, []);

  return (
    <button
      onClick={onOpen}
      className="group relative block w-full overflow-hidden text-left bg-[#EFECE6]"
      style={{ aspectRatio: '3/4' }}
      aria-label={story.caption || 'Style reel'}
    >
      <video
        ref={videoRef}
        src={story.video}
        poster={story.thumbnail || undefined}
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient for caption legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/25" />

      {/* Placeholder transparency badge */}
      {story.is_placeholder && (
        <span className="absolute top-2.5 right-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold tracking-[0.18em] uppercase text-[#1A1A1A]">
          Editorial
        </span>
      )}

      {/* Play button — hover reveal */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/50 flex items-center justify-center">
          <Play className="text-white ml-0.5" fill="currentColor" size={18} />
        </span>
      </div>

      {/* Caption */}
      {story.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <p
            className="text-white leading-tight"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 500,
              fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
              letterSpacing: '0.03em',
            }}
          >
            {story.caption}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.2em] uppercase text-[#C6A15E] opacity-0 group-hover:opacity-100 transition-opacity">
            Watch →
          </span>
        </div>
      )}
    </button>
  );
}

export default function StyleInspiration() {
  const { data: stories } = useStories();
  const { data: banners } = useBanners('reels');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!stories || stories.length === 0) return null;

  const heading = banners?.[0]?.title || FALLBACK_TITLE;
  const subtitle = banners?.[0]?.subtitle;

  return (
    <section className="w-full py-10 sm:py-16" style={{ backgroundColor: '#F9F8F6' }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-2">
              Reels
            </p>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl leading-none text-[#1A1A1A]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.03em' }}
            >
              {heading}
            </h2>
            {subtitle && (
              <p className="mt-2 text-[14px] text-[#767676] font-body max-w-md">{subtitle}</p>
            )}
          </div>
          {banners?.[0]?.cta_link && (
            <Link
              to={banners[0].cta_link}
              className="hidden sm:flex items-center gap-2 text-[12px] font-bold tracking-[0.14em] uppercase text-[#767676] hover:text-[#1A1A1A] transition-colors"
            >
              View all
            </Link>
          )}
        </div>

        {/* Reels grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {stories.map((story, i) => (
            <ReelCard
              key={story.id}
              story={story}
              onOpen={() => setActiveIndex(i)}
            />
          ))}
        </div>
      </div>

      {activeIndex !== null && (
        <StoryViewer
          stories={stories}
          startIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </section>
  );
}
