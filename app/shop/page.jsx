import '@/styles/shop.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ShopView from './ShopView';

export const metadata = { title: 'Shop' };

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => {
    (Array.isArray(v) ? v : [v]).forEach((val) => params.append(k, String(val)));
  });

  return (
    <div className="shop">
      <SiteHeader />
      <ShopView query={params.toString()} />
      <SiteFooter />
    </div>
  );
}
