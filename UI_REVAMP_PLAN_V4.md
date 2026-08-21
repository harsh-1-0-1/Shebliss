# Shebliss UI Revamp — Master Plan v4 (merged, tiered, codebase-verified)

**Supersedes v2/v3 and `UI_REVAMP_REVIEW.md`.** This is the single source of truth for the agent.

Merges three sources, in confidence order:
1. **Codebase-verified review** (v2) — grep-checked against this repo.
2. **Bling Bag screen recordings** (mobile + desktop) — direct observations.
3. **Second AI review** — good ideas, but several UI claims were *inferred* and are corrected against the repo here.

**Tiering key**
- 🟢 **Build it** — verified missing from the Shebliss repo and/or directly observed on Bling Bag.
- 🟡 **Verify first** — plausible; agent must (a) grep the repo and (b) confirm on live Bling Bag before building.
- 🔵 **Separate work item** — real feature with an external dependency (API keys, content pipeline). Not part of the visual pass.

---F

## Ground rules (unchanged)

- React 19.2 + Vite 8 + **TypeScript** (`.tsx`), types in `frontend/src/types/index.ts`.
- Tailwind v4 `@theme` tokens only: `bg-bone`, `bg-card`, `text-espresso`, `text-gold`, `text-slate`, `text-ink`, `border-card`.
- Fetch via existing hooks/stores: `useProducts`, `useProduct`, `useCategories`, `useBanners`, `useStories`, `cartStore`, `wishlistStore`, `currencyStore`. All API calls via `lib/api.ts` → `/api/v1/...`.
- No Bling Bag images/copy — pattern only, Shebliss content.
- `npm run lint` + `npm run build` after every change. **No regressions** in: auth, Razorpay checkout, orders, admin, blog, stories, reviews, coupons, damage claims, corporate gifting, BottomNav, CartDrawer, MegaMenu, search, hero carousel.

---

## Codebase corrections (v3 → v4) — the agent MUST know these

These are verified facts that change how the v3 plan should be executed:

| v3 plan said | Reality (grep-verified) | Impact |
| --- | --- | --- |
| Extend `ProductSummaryOut` (`app/schemas/product.py`) | No such class. List endpoint returns `ProductResponse` (full, incl. `variants`). | Add `available_colors` to `ProductResponse` — **or skip the backend change entirely** (see 1.1) |
| Cards "don't need the full variant payload" | The list endpoint **already returns** `ProductResponse.variants` with colour groups + `color_hex` | Colour swatches can be derived **client-side** from `product.variants` today. Backend delta optional |
| `MegaMenu.tsx` | No such file — mega dropdown is **inline in `Navbar/index.tsx`**; nav data lives in `Navbar/navData.ts` (`NavItemDef`) | Extend `NavItemDef`, not a new component file |
| WhatsApp bubble "new component" | `components/corporate/FloatingWhatsAppButton.tsx` **already exists but is orphaned** (never rendered in `Layout.tsx`) | **Wire it into `Layout`**, don't rebuild. Its prefilled message is corporate-gifting specific — generalise |
| WhatsApp number | Already in `Navbar/navData.ts` (`WHATSAPP_NUMBER`) and in the button | Reuse, don't duplicate |
| PDP accordions assumed missing | `ProductFaq.tsx` (accordion-style FAQs) and `ProductSpecification.tsx` already render on PDP | Only add Care/Shipping accordions if Bling Bag's format differs materially (🟡) |
| PDP already has images/colour swatches | `ProductDetailPage.tsx` renders colour swatch mode, image cards, pill chips, per-combo stock | PDP visual pass is **incremental** (sticky bar + trust grid + reels), not a rebuild |
| Trust copy "source of truth" | `TrustValueBar.tsx` holds `TRUST_ITEMS` inline, unexported, used only on `HomePage.tsx:25` | Extract shared trust copy to `lib/` so `TrustMarquee` + `TrustFeatureGrid` share one source |
| "Instagram-story style" highlights bar | Shebliss **already has an admin-managed Stories system** (`StoriesCarousel.tsx`, `/api/v1/stories`, `StoryViewer`) — currently surfaced on PDP only | Cheapest path: surface existing `StoriesCarousel` on the homepage; don't build a parallel system |
| Dual-CTA hero | `Banner` schema has **one** `cta_text`/`cta_link` (`app/schemas/banner.py`) | Dual CTA needs a schema + admin form change → keep 🟡, don't build speculatively |

---

## Phase 1 — Product Card & QuickView

### 1.1 🟢 Colour swatches on the card
- **Preferred (no backend change):** derive `availableColors` inside `ProductCard.tsx` from `product.variants.variant_groups` — filter groups whose label matches `/colou?r/i`, read `color_hex` (+ `name`, `images?.[0]`). Dedupe, cap at ~5 + overflow "+N".
- **Backend fallback (only if payload size is a real concern):** add a computed `available_colors: [{name, hex, image_url}]` to `ProductResponse` in `app/schemas/product.py` (computed in the service layer, resolved via `resolve_image_url`). Do NOT create a `ProductSummaryOut` — the list endpoint already uses `ProductResponse`.
- Render a small swatch row beneath the image on hover (desktop) / always visible on mobile, each linking to the PDP.

### 1.2 🟢 Named badges (NEW / HOT / BESTSELLER)
- `ProductCard.tsx` already shows `−%` pill and `product.badge`. Add solid high-contrast tags derived from `tags` (e.g. `new-arrival` → "NEW", `best-seller` → "HOT SELLER"). Reuse `productTagBadges.utils.ts` conventions (bg/text/border maps).

### 1.3 🟢 QuickViewModal
- New `store/useQuickViewStore.ts` (zustand, matches `cartStore`/`wishlistStore` pattern): `{ productSlug, open(slug), close() }`.
- New `components/product/QuickViewModal.tsx`: fetch via `useProduct(slug)`, render image (first gallery image), price block, variant picker (reuse the colour/image-card/pill rendering logic — extract the picker from `ProductDetailPage.tsx` into a reusable `VariantPicker.tsx` instead of duplicating), qty stepper, **Add to Cart** → `cartStore.addItem` → `cartStore.openDrawer()`, plus "View Full Details" link.
- Trigger: hover button on card (desktop) / always-visible icon (mobile) in `ProductCard.tsx`. Global mount in `Layout.tsx`.

---

## Phase 2 — Product Detail Page

### 2.1 🟢 Mobile sticky CTA bar
- **Prereq:** create `store/useFloatingUi.ts` (Phase 7's collision store) in this same pass — it is referenced here and by 3.6, so the bottom-offset logic must exist before either element renders. Do not let 2.1 and 3.6 invent offsets independently.
- In `ProductDetailPage.tsx`, `md:hidden`, `fixed bottom-[64px]` (above `BottomNav`, which is 58px), `z-40`. Shows title/price left, **Add to Bag** button right → `handleAddToCart` → opens `CartDrawer`.
- Must hide when the floating app banner (3.6) is visible — read visibility from `useFloatingUi`, see "Floating-element collision rules" below.
- Keep the existing `pb-20` spacer; add clearance if the app banner is also present.

### 2.2 🟢 TrustFeatureGrid
- New `components/product/TrustFeatureGrid.tsx`: 2×2 rounded cards under the buy buttons — COD/Easy Returns, Express 24h Delivery, Free Shipping, Anti-Tarnish/Premium Quality.
- **Extract** the trust copy (`TRUST_ITEMS`) from `TrustValueBar.tsx` into `lib/trust.ts` and import from both places — no duplicated source of truth.

### 2.3 🟡 Care/Shipping/More-Info accordions
- `ProductFaq` + `ProductSpecification` already exist. Only build a new accordion block if live Bling Bag's format (iconic accordions above reviews) differs enough to matter. Grep first; confirm on live site.

### 2.4 🔵 UGC video reels (`ProductVideoReels.tsx`)
- Real feature; needs a decision on content source (CDN vs. CMS field on product vs. reusing the existing Stories/video system) and a player. Separate ticket — **not** in the visual pass.

---

## Phase 3 — Homepage & Navigation

### 3.1 🟢 Desktop + mobile category strip
- `MobileCategoryNav.tsx` is currently wrapped in `lg:hidden` in `HomePage.tsx:15-17`. Remove the breakpoint guard so it renders on both, or add a desktop variant (larger circles / pill tiles) under the hero.

### 3.2 🟡 "Shop by Color" grid (`ShopByColorGrid.tsx`)
- Bling Bag's color menu is confirmed; the homepage **grid** needs a live check. Data options: aggregate colours client-side from `useProducts` (variants), or a curated static array; a homepage block can be static-curated against the catalog's real colour groups. Build only after confirming the visual on live Bling Bag.

### 3.3 🟡 Dual-CTA hero banners
- `HeroBanner.tsx` renders one CTA from `Banner.cta_text/cta_link`. A second CTA requires `secondary_cta_text`/`secondary_cta_link` on the `Banner` schema, `BannerCreate/Update`, the admin banner form, and `HeroBanner.tsx`. Verify on live site first (recordings suggested dual CTAs on some banners).

### 3.4 🟡 Mega-menu visual spotlight
- Extend `NavItemDef` in `navData.ts` with optional `spotlight?: { title, image, link }`; render a promo tile in the right column of the wide dropdown (in `Navbar/index.tsx`, where the dropdown already renders). Verify live desktop menu first.

### 3.5 🟢 TrustMarquee above footer
- New `components/home/TrustMarquee.tsx`: infinite CSS marquee (reuse `animate-marquee` keyframes in `index.css:101-112`) of trust/shipping messages, placed between the last section and `Footer` in `HomePage.tsx`.
- Move `TrustValueBar`'s copy to `lib/trust.ts`; the marquee can replace the static bar on the homepage or sit above it — keep the static bar only where it adds value; don't delete the component if `TrustFeatureGrid` reuses its copy module.

### 3.6 🟢 Floating "Get the App" bar (mobile)
- New `components/home/AppDownloadBanner.tsx` (or `components/layout/AppInstallBar.tsx`): sticky bottom banner, dismissible, Install CTA (deep-link URL placeholder). Must coordinate with BottomNav + PDP sticky bar + WhatsApp bubble (rules below).

### 3.7 🟢 WhatsApp chat bubble
- **Wire the existing** `components/corporate/FloatingWhatsAppButton.tsx` into `Layout.tsx` (storefront-wide). Generalise its prefilled text (currently corporate-gifting specific) using `WHATSAPP_NUMBER` from `navData.ts`. Fix positioning per collision rules.

### 3.8 🟢 Homepage "stories-style" highlight ring (cheap path)
- Shebliss already has admin-managed Stories (`useStories`, `StoriesCarousel`, `StoryViewer`). Surface `StoriesCarousel` on `HomePage.tsx` (currently only on PDP) with a gold "new/unseen" ring treatment. This delivers Bling Bag's IG-stories-style bar without a new system.

---

## Phase 4 — Collection page filtering

### 4.1 🟢 Colour + occasion/style filters (client-side first)
- `ProductsPage.tsx` already filters by price/category/material-tags/in-stock.
- **Colour:** derive available colours from the current result set's `variants` (same logic as 1.1) and filter client-side on the loaded page (or pass as a query param and filter server-side via existing `tags`/new param).
- **Occasion/Style:** reuse existing `tags` (kundan, polki, bridal, festive, antique, temple) as a second tag group in the sidebar — no backend change.
- Keep the mobile bottom drawer pattern (already implemented).

### 4.2 🟡 `/api/v1/products/facets`
- Only if 4.1 proves inaccurate with pagination (counts vs. totals). Do not build preemptively.

---

## Phase 5 — Social proof (Google reviews) 🔵

- `GoogleReviewsWidget.tsx` (star badge 4.x + review cards + "Leave a Review") — requires Google Business Profile API / aggregator keys + cost sign-off. **Flag to client as separate work item.** Do not silently scope into the visual pass.

---

## Phase 6 — Header thumbnail icons 🟡

- `NavItemDef` in `navData.ts` has no image slot (verified). Add optional `icon?: string` and render a small circular thumbnail next to the label in the desktop nav row (`Navbar/index.tsx`) and the mobile drawer items (already show thumbnails via banners/fallbacks). Confirm the live desktop nav actually shows icons before doing desktop work — mobile drawer already has them.

---

## Phase 7 — Floating-element collision rules (NEW, required)

Mobile currently has: `BottomNav` (fixed bottom, 58px, `md:hidden`). This plan adds up to 3 more fixed bottom-right elements. **At most one app-install bar and one PDP CTA bar may render at once; WhatsApp bubble must not overlap either.**

| Element | Placement | Rule |
| --- | --- | --- |
| `BottomNav` | bottom 0, full width | always (non-admin, non-checkout) |
| PDP sticky CTA bar | `bottom-[64px]` | only on `/products/:slug`, `md:hidden`; hidden while app-install bar shown |
| App install bar | bottom 0 **above** BottomNav (`bottom-[58px]`) | hide on PDP (PDP bar takes over); dismissible |
| WhatsApp bubble | bottom-right | mobile `bottom-[130px]` when BottomNav + app bar present; `bottom-[76px]` when only BottomNav; desktop `bottom-7 right-7` (existing) |

Centralise with a tiny store (`store/useFloatingUi.ts`) or module-level flags so components coordinate — do not hardcode in each component.

---

## Backend delta table (final)

| Change | Tier | Where |
| --- | --- | --- |
| `available_colors` on `ProductResponse` (optional) | 🟢-optional | `app/schemas/product.py` + `product_service` |
| Dual-CTA hero fields on `Banner` | 🟡 | `app/schemas/banner.py`, admin banner form |
| Mega-menu spotlight fields on category | 🟡 | `navData.ts` only (no backend needed — nav is static) |
| `/api/v1/products/facets` | 🟡 | only if 4.1 insufficient |
| `POST /api/v1/newsletter` | 🟢-optional | new endpoint + table (footer subscribe is currently client-side only) |

---

## Explicit do-NOT-touch list

Hero carousel core mechanics, AnnouncementBar, sticky header shell, mobile nav drawer, search autocomplete, CartDrawer core, BottomNav, CategoryTabs (`FeaturedProductsGrid.tsx`), section blocks (`CategoryHighlightGrid`, `EditorialCollection`, `TrendingProductsGrid`, `NewArrivalsGrid`), Footer columns/newsletter/socials, existing price/category/material/stock filters, auth, Razorpay checkout, admin panel.

---

## Build order (recommended sequence)

1. **Phase 1** — swatches + badges + `VariantPicker` extraction + QuickViewModal + store. (Biggest visual win, no backend risk.)
2. **Phase 2.1 + 2.2** — **first create `store/useFloatingUi.ts`** (needed by the sticky bar), then PDP sticky bar + TrustFeatureGrid (extract `lib/trust.ts`).
3. **Phase 3.5 + 3.7 + 3.8** — TrustMarquee, wire WhatsApp bubble into Layout, surface StoriesCarousel on homepage. (Cheap, safe.)
4. **Phase 3.1** — promote category strip to both breakpoints.
5. **Phase 3.6 + Phase 7** — app install bar + floating-ui coordination store.
6. **Phase 4.1** — colour + occasion filters (client-side).
7. **Phase 6** — nav icons (after live-site confirm).
8. **🟡 items** — only after live-site confirmation (3.2, 3.3, 3.4, 2.3).
9. **QA** — `npm run lint`, `npm run build`, manual pass (drawer, CartDrawer, Razorpay, QuickView add-to-cart, floating-element overlaps).

---

## Acceptance checklist (tiered)

**🟢 must ship**
- [ ] Card: NEW/HOT badge, colour swatch row, hover/tap QuickView trigger
- [ ] QuickViewModal via `useQuickViewStore`; add-to-cart → CartDrawer; "View Full Details"
- [ ] PDP mobile sticky CTA bar (no BottomNav/app-bar overlap)
- [ ] `TrustFeatureGrid` 2×2 under PDP buy buttons (shared `lib/trust.ts`)
- [ ] Category strip on desktop + mobile
- [ ] TrustMarquee above footer
- [ ] App install bar (dismissible, coordinated with BottomNav/PDP bar)
- [ ] WhatsApp bubble wired storefront-wide, correctly positioned
- [ ] Homepage stories-style ring bar (via existing Stories system)
- [ ] Colour + occasion/style filters on collection page
- [ ] `npm run lint` + `npm run build` clean; no regressions

**🟡 after live-site + grep confirm**
- [ ] PDP Care/Shipping accordions, Shop-by-Color grid, dual-CTA hero, mega-menu spotlight, nav thumbnail icons, `/facets`

**🔵 separate scoped work (client sign-off)**
- [ ] Google Reviews widget (API/cost), UGC video reels (content pipeline)