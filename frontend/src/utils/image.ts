/**
 * Frontend helpers for responsive WebP images.
 *
 * The backend generates responsive variants at upload time:
 *   base:     store/products/42/abc.webp  (up to 1600px wide)
 *   variants: store/products/42/abc_400w.webp, _800w.webp, _1200w.webp
 *
 * These helpers derive variant URLs from the base URL the API returns so the
 * browser can pick the smallest file that still looks crisp via ``srcset``.
 */

/** Variant widths that match the backend's ``VARIANT_WIDTHS``. */
export const IMAGE_VARIANT_WIDTHS = [400, 800, 1200] as const;

/** Max base image width the backend produces (used as the largest srcset entry). */
export const MAX_BASE_WIDTH = 1600;

/**
 * Construct a responsive variant URL from a base image URL.
 *
 *   https://cdn.example.com/store/products/42/abc.webp
 *   → https://cdn.example.com/store/products/42/abc_800w.webp
 *
 * Also works for legacy JPEG/PNG keys (variant is always .webp).
 */
export function getVariantUrl(baseUrl: string, width: number): string {
  return baseUrl.replace(/\.(jpe?g|png|webp)$/i, `_${width}w.webp`);
}

/**
 * Build a ``srcset`` string for a responsive ``<img>`` or ``<source>``.
 *
 *   buildSrcset(url) → "url_400w.webp 400w, url_800w.webp 800w, url_1200w.webp 1200w, url.webp 1600w"
 */
export function buildSrcset(
  baseUrl: string,
  widths: readonly number[] = IMAGE_VARIANT_WIDTHS,
): string {
  const entries = widths.map((w) => `${getVariantUrl(baseUrl, w)} ${w}w`);
  entries.push(`${baseUrl} ${MAX_BASE_WIDTH}w`);
  return entries.join(", ");
}

/**
 * Returns true when the URL points to a WebP image (i.e. processed by the
 * new upload pipeline). Legacy .jpg/.png URLs are served as-is.
 */
export function isWebpUrl(url: string | null | undefined): boolean {
  return !!url && /\.webp(\?|$)/i.test(url);
}
