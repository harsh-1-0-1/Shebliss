# AGENTS.md

Context file for AI agents. Read this first — it explains the whole codebase so you
**do not need to scan the repo**. Only open files relevant to your task.

## What this is

**Shebliss** — a full-stack artificial jewellery e-commerce store.
- Backend: **FastAPI** (Python 3.12+) + async SQLAlchemy 2.0 + Redis
- Frontend: **React 19 + Vite + TypeScript** + Zustand + TanStack Query + Tailwind v4
- Payments: Razorpay · Auth: JWT (+ Google OAuth) · Images: S3/R2 or local static

Catalog: Earrings, Necklaces, Bangles & Bracelets, Bridal, Mangalsutra & Sets, Gift Sets.
Theme colors: Deep Emerald Green, Dark Terracotta, Off-White.

## Repo layout

```
backend/     FastAPI app, Alembic migrations, tests, seed script
frontend/    React + Vite SPA (storefront + admin dashboard)
docs/        Extra docs (e.g. Cloudflare R2 setup)
docker-compose.yml       Production stack (api, web, postgres, redis, nginx)
docker-compose.dev.yml    Dev stack (postgres, redis)
Makefile                  All common commands
.env.example              Root env template for Docker Compose
README.md                 Human-facing setup/deploy guide
```

## Backend (`backend/`)

```
main.py                       FastAPI app entry: lifespan (Redis + background cleanup), middleware, exception handlers
pyproject.toml                Deps + ruff + pytest config
seed.py                       Idempotent seeder (categories, products, users, testimonials); --reset
alembic/                      Migrations
app/
  api/v1/router.py            Wires ALL routers under /api/v1
  api/v1/*.py                 One file per domain: auth, products, cart, orders, payments, admin,
                              coupons, banners, blog, categories, color_families, addresses, reviews,
                              stories, testimonials, corporate_inquiries, damage_claims, settings, health
  api/middleware.py           CloudFront gate middleware
  core/config.py              Pydantic Settings (loads backend/.env.dev then backend/.env)
  core/security.py            JWT + Argon2/bcrypt hashing: get_current_user, get_optional_user, require_admin
  core/rate_limit.py          SlowAPI limiter (real client IP + Redis)
  core/tasks.py               Background: cleanup_abandoned_orders() w/ Redis lock + stock restore
  core/color_families.py      Canonical color families
  db/models.py                ALL SQLAlchemy models (User, Product, Cart, Order, Review, etc.)
  db/session.py               Async engine + session factory + get_db
  schemas/*.py                Pydantic request/response schemas (product.py = variant logic)
  services/*.py               Business logic per domain
  utils/variant_pricing.py    Variant price/stock calculation (server authority)
  utils/image_upload.py       S3/R2/local upload + CDN URL resolution
tests/                        pytest suite (async mode)
static/                       Local file storage fallback
```

### Backend key facts
- API prefix `/api/v1`. Docs at `/docs`.
- All timestamps UTC (`_utcnow()` in models).
- Product `variants`, `images`, `tags`, `faqs` are **JSON** columns.
- **Variant combo key** = option IDs joined by `__` in variant order (e.g. `a1__b2`).
  Shared by backend `variant_pricing.py` and frontend `lib/variants.ts`. Keep them in sync.
- `stock_map` is dense: combo_key -> stock. Missing key raises `StockMapMissingError`
  -> HTTP 500 code `STOCK_MAP_MISSING`.
- **DB stores relative image keys** (e.g. `products/42/abc.webp`); serializers resolve to
  full CDN URLs at response time. Never store full URLs.
- Exception handlers in `main.py`: IntegrityError->409, ImageStorageUnavailable->503, etc.
- Product list responses cached in Redis (300s TTL).
- Store settings is a single-row table (id=1).

## Frontend (`frontend/`)

```
src/main.tsx                  Bootstrap
src/App.tsx                   Router (public under Layout, admin under /admin + AdminLayout) + init
src/lib/api.ts                Axios instance: baseURL VITE_API_BASE_URL, auth + cart-session headers, 401 refresh queue
src/lib/queryClient.ts        TanStack Query client
src/lib/variants.ts           buildComboRows — must match backend combo key logic
src/lib/branding.ts           APP_NAME, logo paths
src/lib/apiError.ts           getApiErrorDetail helper
src/types/index.ts            Shared TS types (Product, VariantGroup, SelectedOptions, CartItem...)
src/store/*.ts                Zustand: authStore, cartStore, currencyStore, useWishlistStore, useFloatingUi
src/hooks/*.ts                React Query wrappers (useProducts, useCart, useAuth, ...)
src/components/               UI grouped: layout, product, cart, auth, admin, ui, common, stories
src/pages/*.tsx               Storefront pages (Home, Products, ProductDetail, Cart, Checkout, Orders...)
src/pages/admin/*.tsx         Admin dashboard pages
```

### Frontend key facts
- Cart session id kept in localStorage as `cart_session_id` and sent via `X-Cart-Session-Id`.
- Tokens in localStorage; axios interceptor auto-refreshes on 401 (queue-based).
- Server state = React Query; client state = Zustand. Don't mix.
- `SelectedOptions` type handles new format (`{option_ids, snapshot}`), legacy dict, or `string[]`.

## Commands

Backend (run from `backend/`, uses `uv`):
```
uv sync --all-extras        # install
uv run fastapi dev          # dev server :8000
uv run pytest tests/ -v     # tests
uv run python seed.py       # seed DB
uv run alembic upgrade head # migrate
uv run ruff check .         # lint
uv run ruff format .        # format
```

Frontend (run from `frontend/`, uses npm):
```
npm install
npm run dev        # Vite dev server :5173
npm run build      # tsc -b + eslint + vite build
npm run lint
```

Or via root `Makefile`: `make dev`, `make test`, `make seed`, `make migrate`, `make lint`,
`make format`, `make frontend-dev`, `make frontend-build`.

Docker: `docker compose -f docker-compose.dev.yml up -d` (dev DB/Redis);
`docker compose up --build -d` (prod); seed: `docker compose --profile seed run --rm seed`.

## Config / env

Backend loads `backend/.env.dev` then `backend/.env` (later overrides). See `.env.example`.
Key vars: `DATABASE_URL` (default sqlite+aiosqlite), `REDIS_URL`, `SECRET_KEY` (required),
`CORS_ORIGINS`, `AWS_*` + `CDN_BASE_URL` (S3/R2), `RAZORPAY_*`, `GOOGLE_*`, `WHATSAPP_*`, `SMTP_*`,
`REQUIRE_CLOUDFRONT`/`CLOUDFRONT_SECRET`.
Frontend build-time vars: `VITE_API_BASE_URL` (default `/api/v1`), `VITE_RAZORPAY_KEY_ID`,
`VITE_CDN_BASE_URL`, `VITE_CORPORATE_INQUIRY_ENDPOINT`.

## Conventions & rules for agents
- Match existing patterns; check neighboring files before adding code.
- Reuse `app/services/` for backend business logic; routes stay thin.
- Never trust client-supplied prices — compute via `app/utils/variant_pricing.py`.
- Keep backend and frontend variant/combo logic in sync.
- Do NOT add comments unless asked.
- Run `make lint` (backend) and `npm run lint` (frontend) after changes.
- Never commit unless explicitly asked.
