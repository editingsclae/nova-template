import '@/styles/pages.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import PageArticle from '@/components/PageArticle';
import { PAGES } from '@/lib/pages';

export const metadata = { title: 'Contact Us' };

export default function ContactPage() {
  return (
    <div className="docpage">
      <SiteHeader />
      <PageArticle page={PAGES.contact} />
      <SiteFooter />
    </div>
  );
}
