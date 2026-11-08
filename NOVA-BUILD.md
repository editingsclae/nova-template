# NOVA storefront: connect the design to the GetCardy backend

You are connecting an existing Next.js design (NOVA, plain JavaScript, hardcoded data) to a real Medusa v2 backend.
Read `ARCHITECTURE.md` in this repo first, then this file. `ARCHITECTURE.md` is the source of truth for every
API call and behaviour rule (section 4 the API map, section 5 categories/customers/variants, section 7 the numbered Rules).
This file only says how those rules apply to NOVA.

## Goal

The same pages and the same look as today, but every piece of shop data comes from the backend, and the cart,
checkout, accounts and orders are real. Nothing about the design changes unless a rule below says so.

## Ground rules

1. **Do not change the look.** Keep the CSS, markup and class names. When real data does not fit a place in the design,
   adapt the data (write a small mapper), not the design.
2. **Stay in JavaScript** (`.js` / `.jsx`, `jsconfig.json`). Do not migrate to TypeScript.
3. **Use the Next.js version this repo has.** Reference code below is written for a newer Next.js: re-check things like
   `params` / `searchParams` (async in Next 15) against this repo's own docs in `node_modules/next/dist/docs/` before using them.
4. **Reference implementation.** `https://github.com/editingsclae/example-zara-storefront` (public, TypeScript) is a finished,
   verified storefront on this same backend. Read its `src/lib/medusa.ts`, `src/lib/declare-layout.ts`,
   `src/instrumentation.ts`, `src/lib/variant-select.ts`, `src/lib/pagination.ts`, `src/lib/email-verification.ts`,
   `src/lib/password-reset.ts`, `src/lib/guest-orders.ts`, `src/lib/product-badge.ts` and `src/components/RichBlocks.tsx`
   and port the logic to JavaScript. Copy its behaviour, not its design. Do not edit that repo.
5. **Only this repo.** Never touch the zara or ALR storefronts, the backend or the portal. Never call `/admin/*`.
6. **Secrets.** Never commit a key. `.env.local` is git-ignored; `.env.example` holds placeholders only.
   `STOREFRONT_LAYOUT_KEY` is a server-side secret and must never start with `NEXT_PUBLIC_`.
7. **No hardcoded shop data may remain**: no `PRODUCTS`, `CATS`, `SIZES` for selection, `ANGLES`, `SHIPPING`, seeded cart,
   seeded orders or demo accounts, no hardcoded store name, currency, carrier or delivery price. Design copy that is not
   merchant data stays (the features strip, the "Engineered for All-Day Comfort" block, the size guide table and the fit hints).
8. If a rule in `ARCHITECTURE.md` and something in this file disagree, `ARCHITECTURE.md` wins, except where this file
   says the NOVA design decides (page order, look).

## Environment

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.getcardy.shop
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...          # the NOVA merchant's key, given in .env.local
NEXT_PUBLIC_STORE_NAME=NOVA
STOREFRONT_LAYOUT_KEY=                              # server only; optional until the merchant creates it in the portal
```

Create `.env.example`, a `Dockerfile` and `output: "standalone"` like the zara template (the three `NEXT_PUBLIC_*` values
are build arguments). In `next.config.mjs` add `images.remotePatterns` for `**.getcardy.shop`, `**.r2.dev`
and `images.unsplash.com`, and keep `unoptimized: true`. The header, footer, page titles and metadata use
`STORE_NAME`; the word NOVA must not be hardcoded anywhere except the env default and the design's local images.
Remove the footer sentence that promises a carrier ("shipped nationwide with Aramex"): the merchant's delivery options decide that.

The dev server runs on port 3001 (`next dev -p 3001`).

## Phases

Work in this order. Commit after each phase with a clear message. Run `npm run lint` and `npm run build` (use
`npx next build --webpack` if the default build fails on this repo) before every push. Push only when both pass.
If a command fails, do not work around it and do not "fix" unrelated code: paste the error and stop.

### Phase 1: data layer
- `lib/medusa.js`: ONE file for every backend call (copy the structure of zara's `medusa.ts`): `medusaFetch`, regions
  (`getDefaultRegion`), `getCategories` (`GET /store/merchant/categories`), `getAllProducts` (paged, `limit=100`, stop at 500),
  `getProductByHandle`, `getStorefrontContent`, `getHomeSections`, `getFooterSettings`, `getFooterPage`, cart functions,
  shipping options, payment collection and session, `completeCart`, orders, claim-orders, email verification, password reset,
  login, register, customer. Always send the publishable key. Product requests use the fields from section 4 "Product field tip".
- Prices come from `calculated_price` and the region currency (`formatPrice`); replace NOVA's `money()` (TND hardcoded).
- Write `lib/product-view.js`: maps a Medusa product to the shape NOVA's components already use
  (`id`/`handle`, `name`, `sub` (subtitle), `price`, `from` (lowest price when variants differ), `img`, `images[]`,
  `stock` (true when any variant is in stock), `badge` from `metadata.badge` only, `cat`). Components keep working with
  almost no change. Delete `PRODUCTS`, `CATS`, `ANGLES`, `SHIPPING` and `byId` from `lib/nova.js` when nothing uses them any more.

### Phase 2: routes, header, footer, categories
- Routes follow the doc: `/shop`, `/c/[handle]` (shop view with the category fixed), `/p/[handle]` (replaces `/product/[id]`),
  `/pages/[slug]` (replaces `/contact`, `/shipping`, `/returns`, `/terms`, `/privacy`), `/cart`, `/checkout`,
  `/order/confirmed`, `/account` (with orders), `/account/login`, `/account/register`, `/account/forgot-password`.
  Keep NOVA's existing `/login`, `/signup` and `/forgot-password` working as redirects to the new paths.
  Add `not-found`, `error` and `loading` pages in NOVA's style.
- Header: the category menu comes from `getCategories()` (handles in URLs, never `?cat=<id>`). Follow rule 22 about not
  listing every category in the top bar (NOVA's header already has a dropdown: show at most the first 5 in the bar).
- Footer: everything from `GET /store/merchant/footer` (rule 26): name, description, social links, Shop column (up to 5),
  Support column (only pages that have text) linking to `/pages/<slug>`. Use NOVA's footer markup and styling.
  The page route draws `blocks` with React elements (rule 26), inside NOVA's page layout.
- Search: the header search goes to `/shop?q=`.

### Phase 3: shop and product pages
- `/shop` and `/c/[handle]`: load the whole catalog once on the server and filter in the browser (rule 20), keeping NOVA's
  filter UI: search, categories (with counts from the API), price range (min/max from the loaded products, not constants),
  in stock only. Keep the state in the URL and use `window.history.replaceState`, never `router.replace`.
  NOVA paginates 9 per page: keep NOVA's 9 per page and its pager, with `?page=N` rules from rule 20 (invalid page falls back).
  Add sort only if NOVA's design has a place for it; do not invent UI.
- `/p/[handle]`: gallery from the product's own images (replace `ANGLES`: thumbnails and lightbox use `product.images`).
  Options and variants exactly as section 5 "How a storefront picks a variant": one button row per option (NOVA's `.sz`
  buttons for every option, with the option title as the label, "EU" only when the option is called Size), hide
  "Default Option", grey out values that cannot be bought, price and stock from the chosen variant, send `variant_id`.
  A product with a single variant shows no picker. Stock text, "Sold out" and the disabled buttons follow the chosen variant's
  `inventory_quantity`. Badge pill from `metadata.badge` only, never invented or translated. Related products: other products
  of the same first category (from the loaded catalog), not hardcoded.
- Product cards: "From <price>" when variants differ; a card with several variants links to the product page.

### Phase 4: cart and checkout
- Replace the localStorage cart (`lib/cart.jsx`) with a Medusa cart (create on first add, keep only the cart id in
  localStorage, no seed). Lines carry `variant_id`; show `variant_title` (not "Default"). Quantity errors from the API show
  under their line. Logout clears the saved cart (rule 31). Keep the header cart badge from the real cart.
- Checkout: keep NOVA's form and steps. Map to the cart address (`first_name`, `last_name`, `address_1`, `address_2`, `city`,
  `postal_code`, `country_code` of the region's country, `phone`) and the cart email. Phone and city are required (rule 16).
  Delivery options come from `GET /store/shipping-options?cart_id=` (rule 17): list them, price 0 shows "Free", an empty list
  shows the "shipping is not set up yet" message (rule 9). Payment is cash on delivery only (`pp_system_default`): payment
  collection, session, complete (rules 16 and section 4). Totals use `item_subtotal`, `shipping_subtotal`, `tax_total`, `total` (rule 30).
  The order confirmation page shows `Order #<display_id>` and the derived status, not the raw one.
- Remove the saved address and note in localStorage unless the design needs them; if kept, they are per-browser conveniences only.

### Phase 5: accounts
- Follow rules 10 to 13, 18, 28 and 29 exactly: three-call registration, token in localStorage only (no cookie; expire a
  legacy `medusa_customer_token` cookie), `POST /store/carts/:id/customer` after login and before completion, the "You already
  have an account" message, claim-orders after the email is confirmed, the 6 digit confirmation box on the account page,
  and the two-step forgot-password flow with the 60 second resend countdown. Orders come from `GET /store/orders` only.
- Delete `lib/auth.js` demo accounts and the seeded orders in `AccountView.jsx`. Keep NOVA's account page layout (profile and orders tabs).
  Shoppers see a derived status (Order placed, Shipped, Delivered) and `Order #<display_id>`.

### Phase 6: home page and layout declaration
Everything the merchant edits comes from `GET /store/merchant/storefront` (rule 23), fetched with `cache: "no-store"`:
- Hero: up to 3 slides from `hero_slides` in NOVA's slider markup; with no slides keep a simple welcome banner.
- Shop by Category: tiles from `category_tiles`, linking to `/c/<handle>`. NOVA shows **4** tiles: define `CATEGORY_TILE_PLACES = 4`
  next to the layout constants and draw at most that many. With no tiles keep the plain list of category cards.
- Promo banners: NOVA has **2** places (Men, Women), between New Arrivals and Best Sellers. Draw `banners.slice(0, LAYOUT.promo_banners)`.
  One banner fills the row, no banner draws nothing.
- Product sections (rule 24): declare `new_arrivals` 8, `best_sellers` 4, `featured` 4, in the order the page draws them
  (no trending row in this design). Page order stays NOVA's: Shop by Category, New Arrivals, the promo banners,
  Best Sellers, Featured Products. Rows come from `GET /store/merchant/storefront/sections`; products are loaded in one request and put back in
  the order of `product_ids`; use `visibleSections`. While `declared` is false show the plain New Arrivals row. Merchant titles
  are the headings (NOVA's headings are only the default). Never fill or draw an empty row. A "Shop all" button under the last row.
- `lib/declare-layout.js` and `src/instrumentation.js` (or `instrumentation.js` at the repo root, whichever this repo's
  structure needs): copy zara's. ONE constant `LAYOUT = { promo_banners: 2, sections: SECTIONS }` is both sent to the
  backend and used to draw the page. The page never draws more than it declares. The log line must read
  `[layout] Declared 2 promo banner places and 3 product sections.`
- Static design blocks (features strip, "Engineered for All-Day Comfort") stay as they are.

### Phase 7: tidy and report
- Search the whole repo for leftovers: `localStorage` keys starting with `nova.` (except the cart id and customer token),
  `PRODUCTS`, `CATS`, `SIZES`, `Aramex`, `TND`, `10` as a shipping price, `demo`, `hello@nova.store`. Remove or justify each.
- `README.md`: env vars, how to run, the layout declaration and the one-constant rule.
- Final report: commit hashes per phase, lint/build results, a list of every API endpoint the storefront calls, and anything
  in `ARCHITECTURE.md` you could not follow with the reason.

## Rules that are easy to get wrong here (from past builds)
- A relative import with the wrong number of `../` only fails at build time: run the build before every push.
- Fetch merchant-edited content (banners, sections, footer, pages) with `cache: "no-store"`, or old content shows for several refreshes.
- Never filter or rank products yourself for Best Sellers, Featured or badges.
- Category handles in URLs are the plain handle; strip any `sc_...--` prefix with `cleanCategoryHandle`.
- Registration needs three calls; the registration token is not a customer token (rule 10).
- A stock of 0 means sold out; never show your own error for it.
- The browser origin `http://localhost:3001` and the deployed domain must be listed in the backend's `STORE_CORS` and `AUTH_CORS`
  (someone else does that); "Failed to fetch" means the origin is missing, not a code bug.
