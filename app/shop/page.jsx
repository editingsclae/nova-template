import '@/styles/shop.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ShopView from './ShopView';
import { getAllProducts, getCategories } from '@/lib/medusa';
import { mapProducts } from '@/lib/product-view';

export const metadata = { title: 'Shop' };

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  Object.entries(sp || {}).forEach(([k, v]) => {
    (Array.isArray(v) ? v : [v]).forEach((val) => params.append(k, String(val)));
  });

  const [rawProducts, rawCategories] = await Promise.all([
    getAllProducts().catch(() => []),
    getCategories().catch(() => []),
  ]);
  const products = mapProducts(rawProducts);

  return (
    <div className="shop">
      <SiteHeader />
      <ShopView
        query={params.toString()}
        initialProducts={products}
        initialCategories={rawCategories}
      />
      <SiteFooter />
    </div>
  );
}
