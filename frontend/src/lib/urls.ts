/**
 * URL helpers for consistent routing across the app.
 * All URLs should go through these helpers to ensure consistency
 * and make future changes easier.
 */

/**
 * Generate a category page URL from a category slug.
 * Uses the /category/:slug route pattern.
 */
export function categoryUrl(slug: string): string {
  return `/category/${slug}`;
}

/**
 * Generate a "shop by color" URL from a color family slug.
 * Uses the /colour/:slug route pattern.
 */
export function colourUrl(slug: string): string {
  return `/colour/${slug}`;
}

/**
 * Generate the shop by color landing page URL.
 */
export function shopByColorUrl(): string {
  return '/shop-by-color';
}

/**
 * Generate a product detail URL from a product slug.
 */
export function productUrl(slug: string): string {
  return `/products/${slug}`;
}

/**
 * Parse the category slug from a URL path.
 * Handles both /category/:slug and legacy ?category= query params.
 */
export function parseCategorySlug(pathname: string, searchParams: URLSearchParams): string | null {
  // First check for new route pattern
  const categoryMatch = pathname.match(/^\/category\/(.+)$/);
  if (categoryMatch) {
    return categoryMatch[1];
  }
  // Fallback to legacy query param
  return searchParams.get('category');
}

/**
 * Parse the color slug from a URL path.
 * Handles /colour/:slug route pattern.
 */
export function parseColourSlug(pathname: string): string | null {
  const colourMatch = pathname.match(/^\/colour\/(.+)$/);
  if (colourMatch) {
    return colourMatch[1];
  }
  return null;
}