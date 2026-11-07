import Link from 'next/link';
import '@/styles/landing.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import HeroSlider from '@/components/HeroSlider';
import AddToCartButton from '@/components/AddToCartButton';
import { Arrow } from '@/components/icons';
import { CATS, PRODUCTS, money, productUrl } from '@/lib/nova';

const SLIDES = [
  {
    img: 'hero',
    label: 'Move Differently',
    title: 'Footwear for a Bolder Tomorrow',
    text: 'Modern sneakers designed for everyday comfort, performance and style.',
    button: 'Shop Collection',
    href: '/shop'
  },
  {
    img: 'hero-real-life',
    label: 'New Season',
    title: 'Built for Real Life',
    text: 'From city streets to weekend escapes, our sneakers move with you.',
    button: 'Shop Men',
    href: '/shop?cat=mens'
  },
  {
    img: 'hero-icons',
    tint: 'light',
    label: 'Everyday Icons',
    title: 'Style in Every Step',
    text: 'Designed for comfort, made for your everyday.',
    href: '/shop?cat=womens'
  }
];

const ARRIVALS = PRODUCTS.slice(0, 8);

/* Curated picks — restocked icons for Best Sellers, the premium/new silhouettes
   the shop wants pushed for Featured. Referenced by id so the choice survives
   any reordering of PRODUCTS. Every pick has single-product artwork: the banner
   images are lifestyle frames with people in them and read wrong in a card. */
function pick(ids) {
  return ids.map((id) => PRODUCTS.find((p) => p.id === id));
}

const BEST_SELLERS = pick(['air-pro', 'silk-road', 'terra-hike', 'street-low']);
const FEATURED = pick(['air-pro-mid', 'court-classic', 'glide', 'run-2']);

const BANNERS = [
  {
    img: 'banner-men',
    label: 'Men',
    title: 'Built for Real Life',
    text: 'From city streets to weekend escapes, our sneakers move with you.',
    button: 'Shop Men’s',
    href: '/shop?cat=mens'
  },
  {
    img: 'banner-women',
    label: 'Women',
    title: 'Style in Every Step',
    text: 'Designed for comfort, made for your everyday.',
    button: 'Shop Women’s',
    href: '/shop?cat=womens'
  }
];

const FEATURES = [
  { h: 'Order Updates', p: 'Follow your order status', d: <><path d="M1 5h12v11H1zM13 9h5l3 3.5V16h-8z" /><circle cx="6" cy="18.5" r="1.9" /><circle cx="17" cy="18.5" r="1.9" /></> },
  { h: 'Clear Details', p: 'What you see is what you get', d: <><path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></> },
  { h: 'Cash on Delivery', p: 'Pay when you receive your order', d: <><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20M6 15h4" /></> },
  { h: 'Need Help?', p: 'Contact the shop', d: <><path d="M4 14v-3a8 8 0 0 1 16 0v3" /><rect x="2" y="13" width="4.5" height="7" rx="2.2" /><rect x="17.5" y="13" width="4.5" height="7" rx="2.2" /></> }
];

/* anchor = the point on the shoe, dot = the label, both in promo3.png pixel space */
const CALLOUTS = [
  { ax: 1470, ay: 140, dx: 1780, dy: 150, label: 'Breathable Knit' },
  { ax: 1470, ay: 300, dx: 1780, dy: 330, label: 'Responsive Cushioning' },
  { ax: 1330, ay: 470, dx: 1780, dy: 520, label: 'Durable Outsole' }
];

function ProductSection({ id, eyebrow, title, items }) {
  const titleId = id + '-title';
  return (
    <section className="container best" aria-labelledby={titleId}>
      <div className="best__head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={titleId}>{title}</h2>
        </div>
        <Link className="btn btn--ghost" href="/shop">View All <Arrow size={13} /></Link>
      </div>

      <div className="grid4">
        {items.map((p) => (
          <article className={'prod' + (p.stock ? '' : ' prod--out')} key={p.id}>
            <div className="prod__media">
              <img src={'/images/' + p.img + '.png'} alt={p.name} loading="lazy" decoding="async" />
            </div>
            <div className="prod__body">
              <div className="prod__info">
                <h4><Link className="prod__name" href={productUrl(p.id)}>{p.name}</Link></h4>
                <p className="prod__sub">{p.sub}</p>
                <p className="prod__price">{money(p.price)}</p>
              </div>
              <AddToCartButton product={p} aria-label={'Add ' + p.name + ' to cart'} disabled={!p.stock} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <HeroSlider slides={SLIDES} />

      <section className="container tiles" aria-labelledby="tiles-title">
        <h2 className="section-title" id="tiles-title">Shop by Category</h2>
        <div className="tiles__row">
          {CATS.map((c) => (
            <Link className="tile" href={'/shop?cat=' + c.id} key={c.id}>
              <span className="tile__name">{c.label}</span>
              <span className="tile__go">Explore <Arrow size={12} /></span>
              <img className="tile__img" src={'/images/cat-' + c.id + '.png'} alt=""
                width="1024" height="768" loading="lazy" decoding="async" />
            </Link>
          ))}
        </div>
      </section>

      <ProductSection id="new-arrivals" eyebrow="Just In" title="New Arrivals" items={ARRIVALS} />

      <section className="banners" aria-label="Featured promotions">
        {BANNERS.map((b) => (
          <Link className="banner" href={b.href} key={b.img}>
            <img className="banner__img" src={'/images/' + b.img + '.png'} alt="" loading="lazy" decoding="async" />
            <span className="banner__scrim" aria-hidden="true" />
            <div className="banner__text">
              <p className="eyebrow eyebrow--light">{b.label}</p>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
              <span className="btn btn--light">{b.button} <Arrow size={13} /></span>
            </div>
          </Link>
        ))}
      </section>

      <ProductSection id="best-sellers" eyebrow="Top Rated" title="Best Sellers" items={BEST_SELLERS} />

      <ProductSection id="featured" eyebrow="Hand Picked" title="Featured Products" items={FEATURED} />

      <section className="features" aria-label="Why shop with us">
        <div className="features__inner">
          {FEATURES.map((f) => (
            <div className="feature" key={f.h}>
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#1c1b18" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {f.d}
              </svg>
              <div><h5>{f.h}</h5><p>{f.p}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="tech" id="tech">
        <div className="tech__panel">
          <img className="tech__img" src="/images/promo3.png" alt="Sneaker outsole detail"
            width="2103" height="748" loading="lazy" decoding="async" />
          <span className="tech__scrim" aria-hidden="true" />
          <svg className="tech__leads" viewBox="0 0 2103 748" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {CALLOUTS.map((c) => (
              <g key={c.label}>
                <line x1={c.ax} y1={c.ay} x2={c.dx} y2={c.dy} />
                <circle cx={c.ax} cy={c.ay} r="4" />
              </g>
            ))}
          </svg>
          <ul className="callouts">
            {CALLOUTS.map((c) => (
              <li style={{ '--y': (c.dy / 748 * 100).toFixed(2) + '%' }} key={c.label}>{c.label}</li>
            ))}
          </ul>
          <div className="tech__copy">
            <p className="eyebrow eyebrow--dark">Our Technology</p>
            <h2>Engineered<br />for All-Day Comfort</h2>
            <p className="tech__lede">Advanced cushioning, breathable materials and lightweight design &mdash; so you can go further in every step.</p>
            <Link className="btn btn--light" href="/shop">Learn More <Arrow size={13} /></Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
