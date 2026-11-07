import '@/styles/pages.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import PageArticle from '@/components/PageArticle';
import { PAGES } from '@/lib/pages';

export const metadata = { title: 'Shipping' };

export default function ShippingPage() {
  return (
    <div className="docpage">
      <SiteHeader />
      <PageArticle page={PAGES.shipping} />
      <SiteFooter />
    </div>
  );
}
