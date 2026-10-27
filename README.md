# ShopSphere

A complete, self-contained e-commerce platform: a responsive Next.js storefront, a role-guarded admin console, and an Express REST API. It follows the supplied design system — INR pricing stored in **paise**, Inter, indigo `#4F46E5`, a 4/8/12/16/24/32/48/64/96 spacing scale, a 1280px storefront shell and a fixed 240px admin sidebar.

Everything runs locally with zero external services. Payments are mocked, data lives in a JSON file, and product imagery is generated SVG artwork.

---

## Quick start

**Requirements:** Node.js 20+ and npm 10+.

```bash
npm install          # installs both workspaces
npm run dev          # API on :4000, storefront on :3000
```

Open <http://localhost:3000>. The API seeds itself on first boot (24 products, 11 users, ~60 orders, reviews).

To start over at any time:

```bash
npm run seed
```

### Demo accounts

| Role     | Email                 | Password   |
| -------- | --------------------- | ---------- |
| Customer | `demo@shopsphere.in`  | `demo123`  |
| Admin    | `admin@shopsphere.in` | `admin123` |

The sign-in screen has one-click buttons that fill either account.

---

## What is included

### Storefront

- Home page with editorial hero, category tiles, new arrivals, best sellers and sale campaign.
- Catalogue with search, category/price/size/colour filters, sorting, pagination and mobile filter sheet.
- Product detail: 4:5 gallery with 1:1 zoom view, variant picker, stock-aware add to cart, delivery PIN check, accordions and verified-purchase reviews.
- Guest cart cookie that merges into the account cart at sign-in; slide-over cart drawer and full cart page.
- Three-step checkout: address → delivery method → payment, with server-side stock reservation and a 15-minute hold countdown.
- Mock payment sheet (UPI, card, netbanking, wallet) with idempotent order creation.
- Account area: overview, order list/detail with tracking timeline, invoice, cancel, buy again, addresses CRUD and profile editing.
- Wishlist, auth pages, and ten footer/info pages driven by `web/lib/info-content.ts`.
- WCAG-minded focus states, skip link, labelled controls, reduced-motion support and responsive layouts.

### Admin console (`/admin`, 240px sidebar)

- Dashboard: revenue/orders/AOV/customer KPIs, SVG revenue trend, needs-attention queue, lowest stock, top products and latest orders.
- Orders: filterable list, detail with fulfilment flow, tracking, cancel and refund actions.
- Products: searchable catalogue, create/edit form with variants, attributes, tags, images and status; archive/delete.
- Inventory: per-variant stock, low/out filters and audited adjustments with history.
- Customers: roles and order counts, promote/demote between customer and admin.
- Reviews: moderation queue, approve/reject and public replies.
- Settings: store profile, shipping/tax defaults and integration status.

---

## Stack

| Layer     | Choice                                                            |
| --------- | ----------------------------------------------------------------- |
| Web       | Next.js 15.5 App Router, React 19, Tailwind CSS 4, Zustand, Lucide |
| API       | Express 4, TypeScript, Zod validation, JWT cookie auth            |
| Data      | JSON file database (`api/src/data/db.json`) with write batching    |
| Cache     | In-process TTL cache for catalogue/storefront reads               |
| Payments  | Built-in mock provider (Razorpay-shaped)                          |
| Money     | Integer paise everywhere in the API; `formatINR` in the UI        |

### Repository layout

```
ShopSphere/
├─ api/                    Express API
│  └─ src/
│     ├─ modules/          auth, storefront, products, cart, checkout, orders, admin…
│     ├─ middleware/       auth, validation, rate limits, errors
│     ├─ lib/              db, cache, orders, catalog helpers
│     └─ seed/             deterministic demo data
├─ web/                    Next.js storefront + admin
│  ├─ app/                 (shop), (auth), (checkout), admin route groups
│  ├─ components/          ui, shop, admin, checkout, account
│  ├─ lib/                 API client, types, formatting, content
│  └─ public/              generated SVG product/editorial artwork
├─ scripts/generate-art.mjs  Regenerates the SVG artwork
└─ .env.example
```

---

## Scripts

| Command             | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Runs API (4000) and web (3000) together           |
| `npm run dev:api`   | API only, with `tsx watch`                        |
| `npm run dev:web`   | Next.js only                                      |
| `npm run build`     | Compiles the API, then builds the Next.js app     |
| `npm run start`     | Runs the compiled API (`api/dist`)                |
| `npm run seed`      | Rewrites the demo database                        |
| `npm run typecheck` | TypeScript checks for both workspaces             |
| `node scripts/generate-art.mjs` | Regenerates all SVG artwork           |

---

## API map

Base URL: `http://localhost:4000/api/v1` (the web app proxies `/api/v1/*` so cookies stay first-party).

| Area       | Endpoints                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------- |
| Auth       | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PATCH /auth/me` |
| Storefront | `GET /storefront/home`, `GET /storefront/suggest?q=`, `GET /categories`                       |
| Products   | `GET /products`, `GET /products/:slug`, admin `POST/PATCH/DELETE /products`                  |
| Cart       | `GET /cart`, `PUT /cart/items`, `DELETE /cart/items/:sku`, `DELETE /cart`, `POST /cart/merge` |
| Wishlist   | `GET /wishlist`, `POST/DELETE /wishlist/:productId`, `DELETE /wishlist`                      |
| Addresses  | `GET/POST /me/addresses`, `PATCH/DELETE /me/addresses/:id`                                   |
| Checkout   | `POST /checkout/quote`, `POST /checkout/session`                                             |
| Payments   | `POST /payments/verify`, `GET /payments/:orderId`, `POST /webhooks/razorpay`                  |
| Orders     | `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`, `PATCH /orders/:id/status`, `POST /orders/:id/refund`, `GET /orders/:id/invoice` |
| Reviews    | `GET/POST /products/:productId/reviews`, `POST /reviews/:id/helpful`, `PATCH /reviews/:id`   |
| Admin      | `GET /admin/stats`, `/admin/products`, `/admin/inventory`, `/admin/users`, `/admin/reviews`, `/admin/settings`, `/admin/audit-logs` |
| Media      | `POST /media/sign` (Cloudinary-style signature placeholder)                                  |
| Health     | `GET /health`                                                                                |

Auth uses an httpOnly `ss_token` cookie. Guest carts use `ss_guest`. Checkout and payment mutations accept an `Idempotency-Key` header, and the API applies per-route rate limits.

### Environment

Copy `.env.example` to `.env` at the repo root (or `api/.env`) to change the port, JWT secret, data file or CORS origin. The API loads the first `.env` it finds. The web app reads `API_URL` from `web/.env.local`; it defaults to `http://localhost:4000`.

---

## Data model notes

- All money is an integer number of **paise** (`₹1,899` → `189900`). The UI formats with `Intl.NumberFormat("en-IN")`.
- Variants own stock: `stock` is on hand, `reserved` is held by pending checkouts, and availability is `stock − reserved`.
- Checkout creates a pending order and reserves stock; payment confirmation marks it paid. An expiry job releases abandoned holds every 60 seconds.
- Order status flow: `pending → paid → packed → shipped → delivered`, with `cancelled` and `refunded` side paths. Every transition appends to the order timeline.
- Reviews require a delivered order for that product (verified purchase) and enter the moderation queue before appearing publicly.
- Admin stock adjustments append an audit entry with actor, delta, reason and resulting counts.

---

## Production adapters

The demo deliberately keeps third-party services out of the critical path. Each boundary is isolated so it can be swapped without touching UI code:

| Concern      | Demo                                   | Production swap                                                                 |
| ------------ | -------------------------------------- | ------------------------------------------------------------------------------- |
| Database     | JSON file + in-memory cache            | Replace `api/src/lib/db.ts` with MongoDB collections (the TypeScript models in `api/src/types.ts` map directly). |
| Cache        | `api/src/lib/cache.ts` TTL map         | Redis client with the same `get/set/invalidate` surface.                        |
| Payments     | `api/src/modules/checkout` mock verify | Razorpay Orders + signature verification; the `POST /webhooks/razorpay` handler already has the shape. |
| Images       | Locally generated SVG art              | Cloudinary upload/signature via `POST /media/sign`; store `{ url, alt, publicId }`. |
| Auth         | bcrypt + JWT cookie                    | Same cookie flow behind Clerk/Auth0, or keep JWT with a managed secret.          |
| Email/SMS    | Toast confirmations only               | Transactional email on paid/shipped events (Resend, SES, MSG91).                |

When wiring a real payment provider, keep these invariants: verify signatures server-side, never trust client amounts, confirm stock reservation inside the same transaction as payment capture, and make webhook handling idempotent.

---

## Design system

| Token          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Primary        | `#4F46E5` (hover `#4338CA`, subtle `#EEF2FF`)                      |
| Type           | Inter, with tabular numerals for prices                            |
| Spacing        | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px                        |
| Storefront     | 1280px max width, 24px gutters                                     |
| Admin          | Fixed 240px sidebar, 1400px content max                            |
| Imagery        | 4:5 listing cards, 1:1 gallery, 16:9 editorial                     |
| States         | Default, hover, focus-visible, active, disabled, loading, empty    |

The tokens live in `web/app/globals.css` and are consumed through Tailwind utilities such as `bg-primary`, `text-muted` and `border-border`.

---

## Demo limitations

- Payments never move money and no card data is stored.
- Email receipts, shipping-carrier tracking and image uploads are simulated.
- Data is a single JSON file; run one API instance at a time.
- Product artwork is abstract SVG generated for the demo, not real photography.
