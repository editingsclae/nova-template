import Link from 'next/link';
import '@/styles/landing.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import HeroSlider from '@/components/HeroSlider';
import ProductCard from '@/components/ProductCard';
import { Arrow } from '@/components/icons';
import {
  getStorefrontContent,
  getHomeSections,
  getDefaultRegion,
  getCategories,
  getAllProducts,
  getProductsByIds,
  cleanCategoryHandle,
  STORE_NAME,
} from '@/lib/medusa';
import { mapProduct } from '@/lib/product-view';
import { LAYOUT, CATEGORY_TILE_PLACES } from '@/lib/declare-layout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_SLIDES = [
  {
    id: 'default-1',
    img: 'hero',
    label: 'Move Differently',
    title: 'Footwear for a Bolder Tomorrow',
    text: 'Modern sneakers designed for everyday comfort, performance and style.',
    button: 'Shop Collection',
    href: '/shop',
  },
];

const FEATURES = [
  {
    h: 'Order Updates',
    p: 'Follow your order status',
    d: (
      <>
        <path d="M1 5h12v11H1zM13 9h5l3 3.5V16h-8z" />
        <circle cx="6" cy="18.5" r="1.9" />
        <circle cx="17" cy="18.5" r="1.9" />
      </>
    ),
  },
  {
    h: 'Clear Details',
    p: 'What you see is what you get',
    d: (
      <>
        <path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z" />
        <path d="m8.8 12 2.2 2.2 4.2-4.4" />
      </>
    ),
  },
  {
    h: 'Cash on Delivery',
    p: 'Pay when you receive your order',
    d: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2.5" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
  },
  {
    h: 'Need Help?',
    p: 'Contact the shop',
    d: (
      <>
        <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
        <rect x="2" y="13" width="4.5" height="7" rx="2.2" />
        <rect x="17.5" y="13" width="4.5" height="7" rx="2.2" />
      </>
    ),
  },
];

const CALLOUTS = [
  { ax: 1470, ay: 140, dx: 1780, dy: 150, label: 'Breathable Knit' },
  { ax: 1470, ay: 300, dx: 1780, dy: 330, label: 'Responsive Cushioning' },
  { ax: 1330, ay: 470, dx: 1780, dy: 520, label: 'Durable Outsole' },
];

function bannerHref(link) {
  if (!link || link.type === 'none') return null;
  if (link.type === 'shop') return '/shop';
  if (link.type === 'category' && link.handle) {
    return `/c/${cleanCategoryHandle(link.handle)}`;
  }
  if (link.type === 'product' && link.handle) {
    return `/p/${link.handle}`;
  }
  return '/shop';
}

function ProductSectionRow({ id, eyebrow, title, items }) {
  if (!items || items.length === 0) return null;
  const titleId = id + '-title';

  return (
    <section className="container best" aria-labelledby={titleId}>
      <div className="best__head">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={titleId}>{title}</h2>
        </div>
        <Link className="btn btn--ghost" href="/shop">
          View All <Arrow size={13} />
        </Link>
      </div>

      <div className="grid4">
        {items.map((p) => (
          <ProductCard p={p} key={p.id} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [storefront, homeSections, region, categories] = await Promise.all([
    getStorefrontContent(),
    getHomeSections(),
    getDefaultRegion(),
    getCategories(),
  ]);

  // 1. Hero slides (up to 3 from backend, fallback to welcome banner)
  const backendSlides = (storefront?.hero_slides || [])
    .filter((s) => s && s.enabled !== false)
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      img: s.image_url,
      label: s.label || '',
      title: s.title || '',
      text: s.text || '',
      button: s.button_label || '',
      href: bannerHref(s.link) || '/shop',
    }));

  const slides = backendSlides.length > 0 ? backendSlides : DEFAULT_SLIDES;

  // 2. Category tiles (up to CATEGORY_TILE_PLACES = 4)
  const backendTiles = (storefront?.category_tiles || [])
    .slice(0, CATEGORY_TILE_PLACES)
    .map((t) => ({
      id: t.id,
      label: t.name,
      href: `/c/${cleanCategoryHandle(t.handle)}`,
      img: t.image_url,
    }));

  const fallbackTiles = (categories || []).slice(0, CATEGORY_TILE_PLACES).map((c) => ({
    id: c.id,
    label: c.name,
    href: `/c/${c.handle}`,
    img: `/images/cat-${c.handle}.png`,
  }));

  const tiles = backendTiles.length > 0 ? backendTiles : fallbackTiles;

  // 3. Promo banners (up to LAYOUT.promo_banners = 2)
  const promoBanners = (storefront?.promo_banners || [])
    .filter((b) => b && b.enabled !== false)
    .slice(0, LAYOUT.promo_banners)
    .map((b) => ({
      id: b.id,
      img: b.image_url,
      label: b.label || '',
      title: b.title || '',
      text: b.text || '',
      button: b.button_label || '',
      href: bannerHref(b.link) || '/shop',
    }));

  // 4. Product sections (Rule 24)
  let newArrivals = [];
  let bestSellers = [];
  let featured = [];

  let newArrivalsTitle = 'New Arrivals';
  let bestSellersTitle = 'Best Sellers';
  let featuredTitle = 'Featured Products';

  if (!homeSections.declared) {
    // While declared is false, show plain New Arrivals row (8 newest products)
    const rawNewest = await getAllProducts({
      limit: 8,
      regionId: region?.id,
      order: '-created_at',
    });
    newArrivals = rawNewest.map(mapProduct);
  } else {
    // When declared is true, draw exactly the sections returned (no empty rows)
    const returnedSections = Array.isArray(homeSections.sections) ? homeSections.sections : [];

    const allProductIds = Array.from(
      new Set(returnedSections.flatMap((s) => s.product_ids || []))
    );

    let productMap = new Map();
    if (allProductIds.length > 0) {
      const rawProducts = await getProductsByIds(allProductIds, region?.id);
      productMap = new Map(rawProducts.map((p) => [p.id, mapProduct(p)]));
    }

    const naSection = returnedSections.find((s) => s.key === 'new_arrivals');
    if (naSection) {
      if (naSection.title) newArrivalsTitle = naSection.title;
      newArrivals = (naSection.product_ids || [])
        .map((id) => productMap.get(id))
        .filter(Boolean);
    }

    const bsSection = returnedSections.find((s) => s.key === 'best_sellers');
    if (bsSection) {
      if (bsSection.title) bestSellersTitle = bsSection.title;
      bestSellers = (bsSection.product_ids || [])
        .map((id) => productMap.get(id))
        .filter(Boolean);
    }

    const featSection = returnedSections.find((s) => s.key === 'featured');
    if (featSection) {
      if (featSection.title) featuredTitle = featSection.title;
      featured = (featSection.product_ids || [])
        .map((id) => productMap.get(id))
        .filter(Boolean);
    }
  }

  const hasAnyProducts =
    newArrivals.length > 0 || bestSellers.length > 0 || featured.length > 0;

  return (
    <>
      <SiteHeader />

      <HeroSlider slides={slides} />

      {tiles.length > 0 && (
        <section className="container tiles" aria-labelledby="tiles-title">
          <h2 className="section-title" id="tiles-title">Shop by Category</h2>
          <div className="tiles__row">
            {tiles.map((t) => (
              <Link className="tile" href={t.href} key={t.id || t.href}>
                <span className="tile__name">{t.label}</span>
                <span className="tile__go">Explore <Arrow size={12} /></span>
                <img
                  className="tile__img"
                  src={t.img}
                  alt=""
                  width="1024"
                  height="768"
                  loading="lazy"
                  decoding="async"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Row 1: New Arrivals */}
      <ProductSectionRow
        id="new-arrivals"
        eyebrow="Just In"
        title={newArrivalsTitle}
        items={newArrivals}
      />

      {/* Promo banners: between New Arrivals and Best Sellers */}
      {promoBanners.length > 0 && (
        <section className="banners" aria-label="Featured promotions">
          {promoBanners.map((b) => (
            <Link className="banner" href={b.href} key={b.id || b.img}>
              <img
                className="banner__img"
                src={b.img}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span className="banner__scrim" aria-hidden="true" />
              <div className="banner__text">
                {b.label ? <p className="eyebrow eyebrow--light">{b.label}</p> : null}
                {b.title ? <h3>{b.title}</h3> : null}
                {b.text ? <p>{b.text}</p> : null}
                {b.button ? (
                  <span className="btn btn--light">
                    {b.button} <Arrow size={13} />
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Row 2: Best Sellers */}
      <ProductSectionRow
        id="best-sellers"
        eyebrow="Top Rated"
        title={bestSellersTitle}
        items={bestSellers}
      />

      {/* Row 3: Featured Products */}
      <ProductSectionRow
        id="featured"
        eyebrow="Hand Picked"
        title={featuredTitle}
        items={featured}
      />

      {/* "Shop all products" button under the last row */}
      {hasAnyProducts && (
        <div className="container" style={{ textAlign: 'center', marginTop: '2.5rem', marginBottom: '3.5rem' }}>
          <Link className="btn btn--dark btn--wide" href="/shop">
            Shop all products <Arrow size={13} />
          </Link>
        </div>
      )}

      {/* Static design blocks */}
      <section className="features" aria-label="Why shop with us">
        <div className="features__inner">
          {FEATURES.map((f) => (
            <div className="feature" key={f.h}>
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="none"
                stroke="#1c1b18"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {f.d}
              </svg>
              <div>
                <h5>{f.h}</h5>
                <p>{f.p}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="tech" id="tech">
        <div className="tech__panel">
          <img
            className="tech__img"
            src="/images/promo3.png"
            alt="Sneaker outsole detail"
            width="2103"
            height="748"
            loading="lazy"
            decoding="async"
          />
          <span className="tech__scrim" aria-hidden="true" />
          <svg
            className="tech__leads"
            viewBox="0 0 2103 748"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            {CALLOUTS.map((c) => (
              <g key={c.label}>
                <line x1={c.ax} y1={c.ay} x2={c.dx} y2={c.dy} />
                <circle cx={c.ax} cy={c.ay} r="4" />
              </g>
            ))}
          </svg>
          <ul className="callouts">
            {CALLOUTS.map((c) => (
              <li
                style={{ '--y': ((c.dy / 748) * 100).toFixed(2) + '%' }}
                key={c.label}
              >
                {c.label}
              </li>
            ))}
          </ul>
          <div className="tech__copy">
            <p className="eyebrow eyebrow--dark">Our Technology</p>
            <h2>Engineered<br />for All-Day Comfort</h2>
            <p className="tech__lede">
              Advanced cushioning, breathable materials and lightweight design &mdash; so you can go further in every step.
            </p>
            <Link className="btn btn--light" href="/shop">
              Learn More <Arrow size={13} />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
