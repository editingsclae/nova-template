'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getOrder, formatPrice, STORE_NAME } from '@/lib/medusa';

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    getOrder(orderId)
      .then((data) => {
        setOrder(data);
      })
      .catch((e) => {
        console.error('Failed to load order:', e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  // Derived status
  let statusText = 'Order placed';
  if (order?.fulfillment_status === 'shipped') statusText = 'Shipped';
  if (order?.fulfillment_status === 'delivered') statusText = 'Delivered';
  if (order?.status === 'canceled') statusText = 'Canceled';

  const displayId = order?.display_id ? String(order.display_id) : (orderId || '');

  return (
    <main className="container" style={{ padding: '4rem 1rem', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: 24 }}>
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>

      <p className="eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', fontSize: '0.875rem' }}>
        Thank You For Your Order
      </p>
      <h1 style={{ fontSize: '2rem', margin: '0.5rem 0 1rem', fontWeight: 700 }}>
        {displayId ? `Order #${displayId}` : 'Order Confirmed'}
      </h1>

      <p style={{ color: '#555', marginBottom: '2rem', lineHeight: 1.6 }}>
        Your order has been placed successfully and will be delivered with Cash on Delivery.
        A confirmation email has been sent to your inbox.
      </p>

      <div style={{ background: '#f9f9f8', border: '1px solid #e5e5e4', borderRadius: 8, padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
          <span style={{ color: '#666' }}>Status</span>
          <span style={{ fontWeight: 600 }}>{statusText}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
          <span style={{ color: '#666' }}>Payment Method</span>
          <span style={{ fontWeight: 600 }}>Cash on delivery</span>
        </div>
        {order?.total != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {formatPrice(order.total, order.currency_code)}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link className="btn btn--dark" href="/shop">
          Continue Shopping
        </Link>
        <Link className="btn btn--ghost" href="/account">
          View Account Orders
        </Link>
      </div>
    </main>
  );
}

export default function OrderConfirmedPage() {
  return (
    <div className="shop">
      <SiteHeader />
      <Suspense fallback={<div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>Loading confirmation…</div>}>
        <ConfirmedContent />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
