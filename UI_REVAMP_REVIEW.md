# Shebliss UI Revamp — Plan vs. Codebase Review

**Reviewed against the actual repo** (frontend `React 19 + Vite 8 + TypeScript + Tailwind v4`, backend `FastAPI`).

## TL;DR

The plan is strong as a **UX spec**, but it assumes a **greenfield rebuild** of a codebase that is already mature and already implements ~70% of the target. If the agent follows the plan verbatim it will duplicate existing components, fight the existing design-token system, and risk breaking a working store (auth, orders, Razorpay, blog, stories, reviews, coupons, damage claims, corporate gifting, admin panel).

**Recommended posture: treat this as an incremental enhancement, not a rebuild.** Keep every existing file; only build the deltas listed in §4.

---

## 1. Stack mismatch (plan → reality)

| Plan says | Codebase actually is | Fix |
| --- | --- | --- |
| React 18 + Vite, **JSX** | React **19.2** + Vite 8, **TypeScript** (`.tsx` everywhere) | Write components as `.tsx`; types already in `frontend/src/types/index.ts` |
| "CSS Modules or Tailwind — pick one" | **Tailwind CSS v4** already set up (`@tailwindcss/vite`, `@theme` in `frontend/src/index.css`) | Keep Tailwind; no CSS modules |
| Suggested folder tree (`components/home/*`, `components/product/*`, `pages/*`, `hooks/*`, `lib/api.js`) | Already matches this shape — `components/home/`, `components/product/`, `components/cart/`, `components/layout/`, `pages/`, `hooks/`, `store/`, `lib/` | Reuse existing folders; don't create `styles/tokens.css` or `lib/api.js` |
| Embla/Swiper carousel lib | Hand-rolled scroll-snap carousels + custom touch-gesture handling (see `ProductDetailPage.tsx` `MobileGallery`) | No new dep needed; add embla only if the new carousels demand it |
| Backend `app/models/product.py`, `app/routers/products.py` | `app/db/models.py`, `app/api/v1/` (versioned routers), `app/services/`, `app/schemas/`, `app/core/`, `app/utils/`, Alembic migrations, Redis cache, rate limiting, CloudFront gate | Add to the **existing** structure |

**Critical API difference:** all real endpoints are prefixed **`/api/v1`** (see `frontend/src/lib/api.ts:3` and `backend/app/api/v1/router.py`). The plan's bare `/api/...` paths must be re-prefixed.

---

## 2. Design tokens — don't create `tokens.css`

The plan proposes `styles/tokens.css` with `--color-*` / `--font-*` custom properties. That system **already exists and is superior**: Tailwind v4 `@theme` in `frontend/src/index.css:4-22` defines the brand palette:

- `bone #F9F8F6` (bg) · `card #EFECE6` · `espresso #2B2421` (text) · `gold #C6A15E` (accent) · `slate #767676` · `ink #1A1A1A`
- Legacy aliases (`primary`, `accent`, `bg`, etc.) so old code keeps working.

The plan's palette intent (near-black `#1A1A1A`, gold accent, warm off-white `#F9F8F6`) **already matches**. One correction: fonts are **Cormorant Garamond + Poppins** (loaded in `index.css:1`), not the plan's Playfair Display + Inter. Keep the brand fonts.

---

## 3. What already exists (plan → codebase map)

Most of the plan is already built. An implementing agent must NOT re-create these:

| Plan item | Existing implementation | Status |
| --- | --- | --- |
| AnnouncementBar (rotating offers, dismissible) | `components/layout/AnnouncementBar.tsx` — marquee ticker, banners-driven, cookie dismiss, currency switcher | ✅ Done |
| Sticky header + MegaMenu dropdowns | `components/layout/Navbar/index.tsx` — sticky, hover mega-dropdowns with groups, subcategory links | ✅ Done |
| Mobile nav drawer (circular thumbnails + submenus) | Same file — slide-out drawer, submenu panel, circular icons | ✅ Done |
| Search with live autocomplete | Same file — debounced `/products?search`, image suggestion dropdown | ✅ Done |
| Hero carousel (autoplay, swipe, arrows) | `components/home/HeroBanner.tsx` — autoplay, touch swipe, arrows, slide indicators | ✅ Done |
| **Category strip (circular bubbles)** | `components/home/MobileCategoryNav.tsx` — horizontal scroll, circles | ⚠️ **Mobile only** |
| CategoryTabs (Best Sellers / New Arrivals / Trending) | `components/home/FeaturedProductsGrid.tsx` — exactly this | ✅ Done |
| Repeating SectionBlocks per category | `CategoryHighlightGrid.tsx`, `EditorialCollection.tsx`, `TrendingProductsGrid.tsx`, `NewArrivalsGrid.tsx` | ✅ Done |
| ProductCard (3:4 ratio, hover swap, discount %, quick-add, wishlist) | `components/product/ProductCard.tsx` — strict `aspect-ratio: 3/4`, crossfade hover swap, `−%` pill, hover Add-to-Bag / Choose Options, wishlist heart | ✅ Done |
| Slide-in CartDrawer (no `/cart` redirect) | `components/cart/CartDrawer.tsx` — right slide-in, qty steppers, subtotal, empty-state suggestions; `cartStore.ts` zustand | ✅ Done |
| Collection page filters + sort + mobile drawer | `pages/ProductsPage.tsx` — price ranges, category tree, material tags, in-stock, sort, pagination, mobile bottom drawer | ✅ Done |
| PDP gallery, colour swatches, variant pickers | `pages/ProductDetailPage.tsx` — colour → circular swatches, image cards, pill chips; per-combo stock logic | ✅ Done |
| Trust/feature badges | `components/home/TrustValueBar.tsx` — 18k Gold Plated / Anti-Tarnish / Hypoallergenic / Water Resistant | ⚠️ Static grid, not a marquee, and not on PDP |
| Footer: columns + newsletter + socials + payments | `components/layout/Footer.tsx` — 4-col grid, newsletter band, socials, payment badges | ⚠️ No app-download badges |
| Mobile bottom nav | `components/layout/BottomNav.tsx` — Home/Shop/Wishlist/Cart/Account (cart opens drawer) | ✅ Bonus, beyond plan |

**Schema mapping** (plan's `ProductOut` is already covered): plan's `regular_price/sale_price/discount_percent` → real `original_price`/`price` (discount derived in card, `ProductCard.tsx:21-24`); plan's `primary_image/hover_image` → real `images[]`; plan's `colors` → real `variants.variant_groups` with `color_hex`; plan's `is_new`/`is_bestseller` → real `tags` (`new-arrival`, `best-seller`). No backend schema change needed for the card.

---

## 4. Real gaps to build (the actual work)

These are the deltas that make it "look like Bling Bag":

1. **QuickViewModal** — does not exist anywhere (`grep QuickView` → 0 hits). Build `components/product/QuickViewModal.tsx` + hover trigger in `ProductCard` (desktop hover / mobile always-visible icon), fetching `/api/v1/products/{slug}`.
2. **PDP sticky bottom bar (mobile)** — `ProductDetailPage` has no fixed bottom Add-to-Cart / Buy Now bar (there's a `pb-20` spacer for BottomNav only). Add a sticky CTA bar (md:hidden) with quantity + add + buy.
3. **PDP trust micro-badges** — "Ready to Ship in 24h / Anti-Tarnish / COD" beneath the checkout buttons. Content already exists in `TrustValueBar.tsx` — reuse as a small component under the buy row.
4. **Card-level "Select Color" swatches** — render `variants.variant_groups` colour swatches under the image on hover/tap, deep-linking to the PDP. Requires card to read `product.variants`.
5. **NEW ARRIVAL / HOT SELLER solid badges** — discount badge + `product.badge` + `ProductTagBadges.tsx` exist, but no bright high-contrast named badge. Add via existing `product.badge` or a derived rule from `tags`.
6. **Category strip on desktop** — `MobileCategoryNav` is `lg:hidden`. Promote to a shared strip (both breakpoints) or add a desktop variant under the hero.
7. **Colour / style filters on collection page** — `ProductsPage` filters are price/category/material/stock. Add colour + occasion/style. Options: derive from variant colour groups (needs a new endpoint, see §5) or filter on existing `tags` (kundan, polki, bridal, festive — already used in nav).
8. **TrustMarquee above footer** — `TrustValueBar` is static. Add the infinite-scroll marquee (keyframes already in `index.css:101-112`).
9. **AppDownloadBanner** — new `components/home/AppDownloadBanner.tsx` (low priority polish).
10. **SeoLinkGrid** — dense category-link grid for SEO/discoverability (footer partially covers it).

**Do not build (already done):** Hero carousel, category tabs, cart drawer, mobile drawer, search autocomplete, mega menu, announcement bar.

---

## 5. Backend deltas (small)

- **`GET /api/v1/categories/{slug}/filters`** — plan item, doesn't exist. Needed only if you want server-driven colour/occasion filter facets. Cheaper alternative: filter by existing `tags` client-side.
- **`POST /api/v1/newsletter`** — no newsletter endpoint exists (footer subscribe is client-side only). Add a tiny endpoint + table if you want real capture.
- **`GET /api/v1/products/featured/{section}`** — not needed; homepage already uses `/products?sort_by=newest|popular&tags=best-seller`. Keep as-is.
- Everything else in the plan's API contract is already live under `/api/v1`.

---

## 6. Corrected build order (incremental, on existing code)

1. **Card upgrades** — `ProductCard.tsx`: named badges, colour swatch row, QuickView trigger.
2. **QuickViewModal** — new component + route-aware fetch (uses existing `useProduct` / `useCartStore`).
3. **PDP mobile sticky bar + trust micro-badges** — `ProductDetailPage.tsx`.
4. **Desktop category strip** — promote `MobileCategoryNav` → shared.
5. **TrustMarquee** — new component (reuse `index.css` marquee keyframes) above footer.
6. **Collection colour/style filters** — extend `ProductsPage.tsx` filters (prefer `tags`-driven; add backend filters endpoint only if necessary).
7. **AppDownloadBanner / SeoLinkGrid** — polish, if desired.
8. **Newsletter endpoint** — optional backend item.
9. **Responsive + perf pass** — lazy-load below-fold images, route code-splitting.

## 7. Adjusted acceptance checklist

- [ ] Card: 3:4 image, hover swap, `−%` badge, **NEW/HOT badge**, **colour swatches**, hover Quick View (all in `ProductCard.tsx`)
- [ ] QuickView modal opens without navigation, add-to-cart works
- [ ] PDP mobile: sticky Add to Cart / Buy Now bar + trust badges
- [ ] Category strip visible on **desktop and mobile**
- [ ] Trust marquee scrolls infinitely above footer
- [ ] Collection page has colour + style filters (mobile drawer included)
- [ ] Cart opens as drawer (already works — do not regress)
- [ ] All colours/fonts via Tailwind `@theme` in `index.css` (already true)
- [ ] No regressions in auth, checkout, admin, blog, stories

## 8. Notes for the agent

- Keep components presentational where the plan says; fetch via existing `hooks/useProducts.ts`, `useCategories.ts`, `useBanners.ts`, zustand stores (`cartStore`, `wishlistStore`, `currencyStore`).
- Use the Tailwind `@theme` tokens (`bg-bone`, `text-espresso`, `border-card`, `text-gold`, etc.) instead of hardcoded hex.
- Never use Bling Bag images/copy — layout pattern only, with Shebliss content and design tokens (per original brief).
- Run `npm run lint` + `npm run build` (runs `tsc -b` + eslint + vite build) in `frontend/` after changes.