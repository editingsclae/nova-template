'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error('Storefront error:', error);
  }, [error]);

  return (
    <div className="shop">
      <SiteHeader />
      <main className="container" style={{ padding: '6rem 1rem' }}>
        <div className="cartempty">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Something went wrong</h2>
          <p>We encountered an unexpected error while loading this page.</p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn--dark" type="button" onClick={() => reset()}>
              Try Again
            </button>
            <Link className="btn btn--ghost" href="/">Go Home</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
