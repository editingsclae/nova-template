# NOVA storefront: setup and live checklist

## A. Before the agent starts (you)

- [ ] Create the merchant in the portal (Merchants page, platform admin). Copy the **publishable key** and sales channel id.
      Delivery (Tunisia zone, Standard Shipping) is created automatically: check Settings > Delivery shows an option.
- [ ] Log in as that merchant and add test data that matches NOVA's design:
      - [ ] 4 categories (Men's, Women's, Running, Lifestyle) with images/tiles
      - [ ] at least 10 products, each with the option **Size** (36 to 45) and a price and stock per size; 3 or more images each
      - [ ] one product with a size at stock 0, and one product entirely out of stock
      - [ ] badges: one Bestseller, one New, one Sale, one custom text, the rest None
      - [ ] Appearance: 3 hero slides, 2 promo banners (Men, Women), the category tiles
      - [ ] Footer: name, description, social links, 3 support pages written
- [ ] Put the key in `.env.local` of the repo on the agent's machine (never in a commit or chat).
- [ ] Add `http://localhost:3001` to `STORE_CORS` and `AUTH_CORS` on the backend (Dokploy) and redeploy.
- [ ] Commit `ARCHITECTURE.md` and `NOVA-BUILD.md` to the repo root of `nova-template` and push.
- [ ] Give the agent the prompt from the chat.

## B. After each agent report

- [ ] The agent reports lint and build passed, and the commit hashes. If anything failed, paste the error back to me; do not let the agent patch around it.

## C. Live checks on localhost (before deploying)

Catalogue
- [ ] Home, Shop and each category show only this merchant's products and categories
- [ ] Header menu and footer Shop column show the merchant's categories, not Shirts/Pants or another merchant's
- [ ] Search finds a product by name; price filter range matches the real prices; "in stock only" hides sold-out products
- [ ] More than 9 products: pagination shows, `?page=2` survives a refresh, Back from a product returns to the same page
- [ ] Prices show in TND from the region (change nothing in code, price edit in the portal shows after a refresh)

Product page
- [ ] Gallery shows the product's own images, thumbnails and lightbox work
- [ ] Size buttons are the product's sizes; a size at stock 0 is greyed out; a fully sold-out product shows Sold out
- [ ] Switching size changes price and stock text; a product with one variant shows no picker
- [ ] Badge pill shows exactly the portal text; no badge when None
- [ ] Add to cart and Buy it now both work with the chosen size

Home page
- [ ] Hero slides, tiles and promo banners match the portal; edit one in the portal and see it after one refresh
- [ ] Server log on start: `[layout] Declared 2 promo banner places and 3 product sections.` (after the layout key is set)
- [ ] Portal Appearance shows exactly 2 promo places and the sections tab lists New Arrivals, Best Sellers, Featured only
- [ ] Add a third promo banner in the portal: the portal blocks it, and the page still draws 2
- [ ] New Arrivals, then promo banners, then Best Sellers and Featured; Best Sellers appears only after enough sales
- [ ] Turn a section off or rename it in the portal: the row disappears or the heading changes
- [ ] 5 or more category tiles in the portal: the page still draws 4

Cart and checkout
- [ ] Cart shows variant (for example "EU 42"), quantity stepper, remove, correct totals; refresh keeps the cart
- [ ] Checkout needs email, phone and city; delivery options come from the portal (rename one or set it to 0 and see "Free")
- [ ] Cash on delivery only, no card wording
- [ ] Order completes; the confirmation shows `Order #<number>`; the order is in the merchant portal with the right size
- [ ] Order confirmation email arrives at the checkout email

Accounts
- [ ] Register works, then confirm the email with the 6 digit code; "Email confirmed" badge shows
- [ ] Register again with the same email: "You already have an account with this email. Log in instead."
- [ ] Log in, refresh: still logged in; My orders shows only NOVA orders (same email on Zara shows its own)
- [ ] Guest order placed before registering shows in My orders after confirming the email
- [ ] Forgot password: code email arrives, reset works, auto-login
- [ ] Log out clears the cart

Pages and footer
- [ ] Footer name, description, social links and support links match the portal; a page without text is not listed
- [ ] `/pages/shipping` (and the others) shows the merchant's formatted text; an unwritten page is a 404

Leftovers
- [ ] No demo account (hello@nova.store) logs in; no seeded orders or cart items appear for a new visitor
- [ ] Browser devtools: no request goes to `/admin/*`; no secret in the page source

## D. Deploy

- [ ] Dokploy app from the repo, Dockerfile build, the three `NEXT_PUBLIC_*` as build arguments, `STOREFRONT_LAYOUT_KEY` as a runtime env var
- [ ] Domain added to `STORE_CORS` and `AUTH_CORS`, backend redeployed
- [ ] Create the layout key in the portal (Appearance > Promo banners > Storefront connection), set it, restart; check the log line
- [ ] Repeat the smoke test: `curl -s https://api.getcardy.shop/store/products?limit=3 -H "x-publishable-api-key: $PK"` returns only NOVA's products
- [ ] Place one real test order on the deployed domain and see it in the portal
