import { useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

// Desktop hover-magnifier for a single image. Scales toward the cursor.
export function ZoomableImage({
  src,
  alt,
  zoom = 2.5,
  className = '',
}: {
  src: string;
  alt: string;
  zoom?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [hovering, setHovering] = useState(false);

  function handleMove(e: React.MouseEvent) {
    const el = containerRef.current;
    const img = imgRef.current;
    if (!el || !img) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden cursor-zoom-in ${className}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        if (imgRef.current) imgRef.current.style.transformOrigin = '50% 50%';
      }}
      onMouseMove={handleMove}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        className="w-full h-full object-cover transition-transform duration-150 ease-out will-change-transform"
        style={{ transform: hovering ? `scale(${zoom})` : 'scale(1)' }}
      />
    </div>
  );
}

// Fullscreen image viewer. Mobile: native pinch/pan via a scrollable oversized image.
// Desktop: wheel or +/- buttons toggle between fit and a zoomed, scrollable view.
export function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/95 flex flex-col"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="flex items-center justify-between p-3 sm:p-4 text-white z-10 shrink-0">
        <span className="text-xs text-white/60 tracking-wide truncate pr-4">{alt}</span>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close viewer"
        >
          <X size={22} />
        </button>
      </div>

      <div
        className="flex-1 overflow-auto flex items-center justify-center"
        onWheel={(e) => setZoomed(e.deltaY > 0)}
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'pan-x pan-y' }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="select-none transition-[width] duration-200"
          style={
            zoomed
              ? { width: '200%', maxWidth: 'none', objectFit: 'contain' }
              : { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
          }
        />
      </div>

      <div className="flex items-center justify-center gap-4 p-3 text-white z-10 shrink-0">
        <button
          onClick={() => setZoomed(false)}
          className={`p-2.5 rounded-full border transition-colors ${!zoomed ? 'bg-white/15 border-white/30' : 'border-white/30 hover:bg-white/10'}`}
          aria-label="Zoom out"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={() => setZoomed(true)}
          className={`p-2.5 rounded-full border transition-colors ${zoomed ? 'bg-white/15 border-white/30' : 'border-white/30 hover:bg-white/10'}`}
          aria-label="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
      </div>
    </div>
  );
}