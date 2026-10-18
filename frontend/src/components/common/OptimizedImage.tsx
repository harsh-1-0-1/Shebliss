import { useState, type ImgHTMLAttributes } from 'react';
import { buildSrcset, hasVariants, IMAGE_VARIANT_WIDTHS } from '@/utils/image';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  /** Image URL as returned by the API (the full-size WebP or legacy JPEG). */
  src: string;
  alt: string;
  /** Responsive widths to include in the srcset. Defaults to [400, 800, 1200]. */
  widths?: readonly number[];
  /**
   * ``sizes`` attribute — tells the browser how wide the image will be displayed
   * at different breakpoints so it can pick the right variant from the srcset.
   * Example: "(min-width: 768px) 50vw, 100vw"
   */
  sizes?: string;
  /** "lazy" (default) or "eager" for above-the-fold images. */
  loading?: 'lazy' | 'eager';
  /** Fires only when the original URL itself fails to load. */
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Responsive image that adds a ``srcset`` of the backend's WebP variants
 * (``_400w``/``_800w``/``_1200w``) so the browser downloads the smallest file
 * that still looks crisp.
 *
 * Only uploaded images (``/store/`` keys) get a srcset; external or bundled
 * URLs render as a plain ``<img>``. If a variant is missing (legacy upload),
 * the srcset is dropped and the original URL is loaded instead.
 */
export function OptimizedImage({
  src,
  alt,
  widths = IMAGE_VARIANT_WIDTHS,
  sizes,
  loading = 'lazy',
  onError,
  className,
  ...imgProps
}: OptimizedImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const responsive = hasVariants(src) && failedSrc !== src;

  return (
    <img
      src={src}
      srcSet={responsive ? buildSrcset(src, widths) : undefined}
      sizes={responsive ? sizes : undefined}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={(e) => {
        if (responsive) {
          setFailedSrc(src);
          return;
        }
        onError?.(e);
      }}
      {...imgProps}
    />
  );
}

export default OptimizedImage;
