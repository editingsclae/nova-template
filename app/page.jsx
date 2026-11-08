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
} from '@/lib/medusa';
import { mapProduct, mapProducts } from '@/lib/product-view';
import {
  LAYOUT,
  CATEGORY_TILE_PLACES,
  visibleSections,
  visiblePromoBanners,
} from '@/lib/declare-layout';

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
          <ProductCard p={p} key={p.id} variant="home" />
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

  const currency = region?.currency_code || '';

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

  // 2. Category tiles: up to 4 tiles. If no tiles from backend, render categories as plain cards without an image.
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
    href: `/c/${cleanCategoryHandle(c.handle)}`,
    img: null,
  }));

  const tiles = backendTiles.length > 0 ? backendTiles : fallbackTiles;

  // 3. Promo banners (up to LAYOUT.promo_banners = 3)
  const promoBanners = visiblePromoBanners(storefront?.promo_banners).map((b) => ({
    id: b.id,
    img: b.image_url,
    label: b.label || '',
    title: b.title || '',
    text: b.text || '',
    button: b.button_label || '',
    href: bannerHref(b.link) || '/shop',
  }));

  const promoBannersRow = promoBanners.slice(0, 2);
  const thirdPromoBanner = promoBanners[2] || null;

  // 4. Product sections cut with visibleSections
  const defaultEyebrows = {
    new_arrivals: 'Just In',
    best_sellers: 'Top Rated',
    featured: 'Hand Picked',
  };

  const defaultTitles = {
    new_arrivals: 'New Arrivals',
    best_sellers: 'Best Sellers',
    featured: 'Featured Products',
  };

  let rows = [];

  if (!homeSections?.declared) {
    // While declared is false, show plain New Arrivals row (8 newest products)
    const rawNewest = await getAllProducts({
      limit: 8,
      regionId: region?.id,
      order: '-created_at',
    });
    const items = mapProducts(rawNewest, currency);
    if (items.length > 0) {
      rows = [
        {
          key: 'new_arrivals',
          title: 'New Arrivals',
          eyebrow: 'Just In',
          items,
        },
      ];
    }
  } else {
    // When declared is true, cut sections with visibleSections helper
    const cutSections = visibleSections(homeSections.sections);
    const allProductIds = Array.from(
      new Set(cutSections.flatMap((s) => s.product_ids || []))
    );

    let productMap = new Map();
    if (allProductIds.length > 0) {
      const rawProducts = await getProductsByIds(allProductIds, region?.id);
      productMap = new Map(rawProducts.map((p) => [p.id, mapProduct(p, currency)]));
    }

    rows = cutSections
      .map((s) => ({
        key: s.key,
        title: s.title || defaultTitles[s.key] || s.key,
        eyebrow: defaultEyebrows[s.key] || '',
        items: (s.product_ids || []).map((id) => productMap.get(id)).filter(Boolean),
      }))
      .filter((row) => row.items.length > 0);
  }

  const newArrivalsRow = rows.find((r) => r.key === 'new_arrivals');
  const otherRows = rows.filter((r) => r.key !== 'new_arrivals');

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
                {t.img ? (
                  <img
                    className="tile__img"
                    src={t.img}
                    alt=""
                    width="1024"
                    height="768"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Row 1: New Arrivals (if present) */}
      {newArrivalsRow && (
        <ProductSectionRow
          id={newArrivalsRow.key}
          eyebrow={newArrivalsRow.eyebrow}
          title={newArrivalsRow.title}
          items={newArrivalsRow.items}
        />
      )}

      {/* Promo banners: between New Arrivals and Best Sellers */}
      {promoBannersRow.length > 0 && (
        <section className="banners" aria-label="Featured promotions">
          {promoBannersRow.map((b) => (
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

      {/* Remaining product section rows in declared order (Best Sellers, Featured, etc.) */}
      {otherRows.map((row) => (
        <ProductSectionRow
          key={row.key}
          id={row.key}
          eyebrow={row.eyebrow}
          title={row.title}
          items={row.items}
        />
      ))}

      {/* "Shop all products" button under the last row */}
      {rows.length > 0 && (
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

      {/* Third promo banner: replaces static tech block */}
      {thirdPromoBanner && (
        <section className="tech" id="tech">
          <div className="tech__panel">
            {thirdPromoBanner.img ? (
              <img
                className="tech__img"
                src={thirdPromoBanner.img}
                alt=""
                width="2103"
                height="748"
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <span className="tech__scrim" aria-hidden="true" />
            <div className="tech__copy">
              {thirdPromoBanner.label ? (
                <p className="eyebrow eyebrow--dark">{thirdPromoBanner.label}</p>
              ) : null}
              {thirdPromoBanner.title ? <h2>{thirdPromoBanner.title}</h2> : null}
              {thirdPromoBanner.text ? (
                <p className="tech__lede">{thirdPromoBanner.text}</p>
              ) : null}
              {thirdPromoBanner.button ? (
                <Link className="btn btn--light" href={thirdPromoBanner.href}>
                  {thirdPromoBanner.button} <Arrow size={13} />
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </>
  );
}
