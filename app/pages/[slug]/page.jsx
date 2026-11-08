import '@/styles/pages.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RichBlocks from '@/components/RichBlocks';
import { Chev } from '@/components/icons';
import { getFooterPage } from '@/lib/medusa';

const KNOWN_SLUGS = ['contact', 'shipping', 'returns', 'privacy', 'terms'];

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (!KNOWN_SLUGS.includes(slug)) return { title: 'Page Not Found' };

  try {
    const page = await getFooterPage(slug);
    return {
      title: page?.title || slug.charAt(0).toUpperCase() + slug.slice(1),
    };
  } catch (e) {
    return { title: slug.charAt(0).toUpperCase() + slug.slice(1) };
  }
}

export default async function SupportPage({ params }) {
  const { slug } = await params;
  if (!KNOWN_SLUGS.includes(slug)) {
    notFound();
  }

  let page = null;
  try {
    page = await getFooterPage(slug);
  } catch (err) {
    if (err.status === 404) {
      notFound();
    }
    throw err;
  }

  if (!page) {
    notFound();
  }

  return (
    <div className="shop">
      <SiteHeader />
      <main className="container doc">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <Chev />
          <span>{page.title}</span>
        </nav>

        <h1 className="doc__title">{page.title}</h1>

        <article className="doc__card">
          <RichBlocks
            blocks={page.blocks}
            text={page.text}
            pageTitle={page.title}
          />
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
