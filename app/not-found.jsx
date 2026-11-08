import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function NotFound() {
  return (
    <div className="shop">
      <SiteHeader />
      <main className="container" style={{ padding: '6rem 1rem' }}>
        <div className="cartempty">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.6-3.6" />
          </svg>
          <h2>Page Not Found</h2>
          <p>The page you are looking for does not exist or may have moved.</p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link className="btn btn--dark" href="/shop">Browse the Shop</Link>
            <Link className="btn btn--ghost" href="/">Go Home</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
