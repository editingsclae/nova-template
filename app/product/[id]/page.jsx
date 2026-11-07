import '@/styles/product.css';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ProductView from './ProductView';
import { CAT_LABEL, DEFAULT_SIZE, SIZES, byId, gallery, money } from '@/lib/nova';

const ORIGIN = 'https://nova.store.example';

function decode(raw) {
  try { return decodeURIComponent(raw); } catch { return raw; }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = byId(decode(id));
  if (!p) return { title: 'Product' };
  return {
    title: { absolute: `${p.name} — ${CAT_LABEL[p.cat]} | NOVA` },
    description: `${p.name} — ${p.sub}. ${money(p.price)} with cash on delivery across Tunisia.`
  };
}

function Missing() {
  return (
    <div className="shop">
      <SiteHeader />
      <main className="container">
        <div className="cartempty">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>
          <h2>We couldn’t find that pair</h2>
          <p>The link may be out of date, or the style has sold out and been retired.</p>
          <Link className="btn btn--dark" href="/shop">Browse the shop</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default async function ProductPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const product = byId(decode(id));
  if (!product) return <Missing />;

  const frames = gallery(product);
  const fi = Math.min(Math.max(+(sp.img || 1) - 1, 0), frames.length - 1);
  const wanted = +(sp.size || 0);
  const size = SIZES.indexOf(wanted) > -1 ? wanted : DEFAULT_SIZE;

  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.sub,
    image: frames.map((f) => ORIGIN + f.src),
    brand: { '@type': 'Brand', name: 'NOVA' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'TND',
      availability: product.stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  });

  return (
    <>
      <ProductView product={product} frames={frames} initialFrame={fi} initialSize={size} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
    </>
  );
}
