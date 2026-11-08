import '@/styles/product.css';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ProductView from './ProductView';
import { getProductByHandle, getAllProducts, formatPrice, STORE_NAME } from '@/lib/medusa';
import { mapProduct, mapProducts } from '@/lib/product-view';

function decode(raw) {
  try { return decodeURIComponent(raw); } catch { return raw; }
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const p = await getProductByHandle(decode(handle)).catch(() => null);
  if (!p) return { title: 'Product' };
  const mapped = mapProduct(p);
  return {
    title: { absolute: `${mapped.name} | ${STORE_NAME}` },
    description: `${mapped.name} — ${mapped.sub}. ${formatPrice(mapped.price, mapped.currencyCode)} with cash on delivery across Tunisia.`,
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
  const { handle } = await params;
  const sp = await searchParams;
  const rawProduct = await getProductByHandle(decode(handle)).catch(() => null);
  if (!rawProduct) return <Missing />;

  const product = mapProduct(rawProduct);

  // Load catalog to find related products (other products of the same first category)
  const allRaw = await getAllProducts().catch(() => []);
  const allProducts = mapProducts(allRaw);
  const related = allProducts
    .filter((p) => p.id !== product.id && p.cat && p.cat === product.cat)
    .slice(0, 4);

  return (
    <div className="shop">
      <SiteHeader />
      <ProductView
        product={product}
        rawProduct={rawProduct}
        related={related}
        searchParams={sp}
      />
      <SiteFooter />
    </div>
  );
}
