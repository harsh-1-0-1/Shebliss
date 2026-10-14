import { useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { buildSrcset, IMAGE_VARIANT_WIDTHS } from '@/utils/image';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  /** Base image URL as returned by the API (the full-size WebP or legacy JPEG). */
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
  /** Error handler — fires after internal fallback has already kicked in. */
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Wrap the <img> in extra JSX (e.g. for ref access) — rarely needed. */
  children?: ReactNode;
}

/**
 * Responsive image component that serves WebP variants via ``<picture>`` + ``srcset``.
 *
 * The browser picks the smallest variant that still looks crisp for the viewport.
 * If a variant doesn't exist (e.g. legacy image not yet migrated), ``onError``
 * fires and the component falls back to a plain ``<img>`` with the original URL.
 *
 * Always adds ``decoding="async"`` for non-blocking decode.
 */
export function OptimizedImage({
  src,
  alt,
  widths = IMAGE_VARIANT_WIDTHS,
  sizes,
  loading = 'lazy',
  onError,
  children,
  className,
  ...imgProps
}: OptimizedImageProps) {
  const [failed, setFailed] = useState(false);

  // Fallback: a variant URL 404'd (legacy image without variants).
  // Render a plain <img> with the original URL which definitely exists.
  if (failed) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        {...imgProps}
      />
    );
  }

  const srcset = buildSrcset(src, widths);

  return (
    <picture>
      <source type="image/webp" srcSet={srcset} sizes={sizes} />
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        onError={(e) => {
          setFailed(true);
          onError?.(e);
        }}
        {...imgProps}
      />
      {children}
    </picture>
  );
}

export default OptimizedImage;
