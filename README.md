# NOVA Storefront

A modern, fast Next.js e-commerce storefront for NOVA, connected to a Medusa v2 multi-tenant backend.

## Environment Variables

Configure the following variables in `.env.local` (see `.env.example`):

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.getcardy.shop
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...       # The merchant's publishable API key
NEXT_PUBLIC_STORE_NAME=NOVA                     # Storefront display name (fallback: NOVA)
STOREFRONT_LAYOUT_KEY=                          # Optional server-only layout secret from merchant portal
```

> **Security Note:** Never commit `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` or `STOREFRONT_LAYOUT_KEY` into git. Keep `.env.local` git-ignored.

## Running the Storefront

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Development
```bash
npm install
npm run dev
```
The development server will run on `http://localhost:3000` (or `http://localhost:3001` if specified with `next dev -p 3001`).

### Production Build
```bash
npm run build
npm start
```

### Docker / Standalone Deployment
A multi-stage `Dockerfile` is provided with `output: 'standalone'` support. Build arguments for Docker:
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STORE_NAME`

```bash
docker build \
  --build-arg NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.getcardy.shop \
  --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... \
  --build-arg NEXT_PUBLIC_STORE_NAME=NOVA \
  -t nova-storefront .
```

## Layout Declaration & The One-Constant Rule

The storefront dynamic layout (promo banner places and product sections) is declared to the Medusa backend during server instrumentation.

To ensure consistency between what the merchant portal configures and what the storefront renders, the layout is governed by **ONE** single constant in `lib/declare-layout.js`:

```javascript
export const CATEGORY_TILE_PLACES = 4;

export const LAYOUT = {
  promo_banners: 3,
  sections: [
    { key: 'new_arrivals', count: 8 },
    { key: 'best_sellers', count: 4 },
    { key: 'featured', count: 4 },
  ],
};
```

### Rules:
1. **The One-Constant Rule:** Both the server declaration (`PUT /store/merchant/storefront/layout`) and the homepage rendering component (`app/page.jsx`) consume the same `LAYOUT` constant.
2. **Never Draw More Than Declared:** The page never draws more than `LAYOUT.promo_banners` promo banners (`banners.slice(0, LAYOUT.promo_banners)`), and only renders sections defined in `LAYOUT.sections`.
3. **No Empty Rows:** When product sections are declared, sections with 0 products or turned off by the merchant are never rendered, and rows are never artificially backfilled.
4. **Server Instrumentation:** When `STOREFRONT_LAYOUT_KEY` is present, `instrumentation.js` sends the layout declaration to the backend on startup, logging:
   `[layout] Declared 3 promo banner places and 3 product sections.`

## Architecture & Features

- **Data Layer:** Single Store API client (`lib/medusa.js`) scoped via the merchant's publishable API key header `x-publishable-api-key`.
- **Cart & Checkout:** Real Medusa v2 cart with live shipping options (`GET /store/shipping-options?cart_id=`), cash-on-delivery session (`pp_system_default`), and order completion.
- **Customer Auth & Accounts:** 3-call registration (`/auth/customer/emailpass/register` -> `/store/customers` -> `/auth/customer/emailpass`), token stored in `localStorage` only, 6-digit email confirmation code with Resend countdown, automatic order claiming (`POST /store/merchant/claim-orders`), and 2-step password reset.
- **Shop & Filtering:** Dynamic catalog loading with in-browser case/accent-insensitive search, price range filter matching real catalog bounds, and URL state synchronised via `window.history.replaceState`.
- **Dynamic Content:** Merchant appearance (hero slides, promo banners, category tiles, product sections, footer links, and legal/policy pages) rendered directly from backend APIs with `cache: 'no-store'`.

