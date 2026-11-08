'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { TickPlain } from '@/components/icons';
import { getOrder, formatPrice } from '@/lib/medusa';

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('medusa_token') : null;

    getOrder(orderId, token)
      .then((data) => {
        setOrder(data);
      })
      .catch((e) => {
        console.error('Failed to load order:', e);
        setError('Could not load order details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <main className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--sub, #666)' }}>Loading order details…</p>
      </main>
    );
  }

  if (error || (!order && !loading)) {
    return (
      <main className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="conf" style={{ maxWidth: 540, margin: '0 auto' }}>
          <div className="conf__card">
            <h1>Order details</h1>
            <p className="conf__lede">{error || 'Order not found.'}</p>
            <div className="conf__acts">
              <Link className="btn btn--dark btn--wide" href="/shop">Continue shopping</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Derived status (Rule 16)
  let statusText = 'Order placed';
  if (order.fulfillment_status === 'shipped') statusText = 'Shipped';
  if (order.fulfillment_status === 'delivered') statusText = 'Delivered';
  if (order.status === 'canceled') statusText = 'Canceled';

  const displayId = order.display_id ? String(order.display_id) : orderId;
  const addr = order.shipping_address || {};
  const currency = order.currency_code || 'tnd';

  return (
    <main className="container">
      <div className="conf">
        <div className="conf__card">
          <div className="conf__tick"><TickPlain /></div>
          <h1>Order placed</h1>
          <p className="conf__lede">
            We’ve emailed a confirmation to <b>{order.email}</b>.
            {addr.phone ? (
              <> The courier will call <b>{addr.phone}</b> before arriving.</>
            ) : null}
          </p>

          <div className="conf__grid">
            <div>
              <p className="conf__k">Order number</p>
              <p className="conf__v"><b>Order #{displayId}</b></p>
            </div>
            <div>
              <p className="conf__k">Status</p>
              <p className="conf__v">{statusText}</p>
            </div>
            <div>
              <p className="conf__k">Ship to</p>
              <p className="conf__v">
                {addr.first_name} {addr.last_name}<br />
                {addr.address_1}
                {addr.address_2 ? <><br />{addr.address_2}</> : null}<br />
                {addr.city} {addr.postal_code}<br />
                Tunisia
              </p>
            </div>
            <div>
              <p className="conf__k">Payment</p>
              <p className="conf__v">
                Cash on delivery<br />
                <b>{formatPrice(order.total, currency)}</b> due when the parcel arrives
              </p>
            </div>
          </div>

          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="conf__items">
              <h2>Your items</h2>
              {order.items.map((item) => {
                const vTitle = item.variant_title && item.variant_title !== 'Default' ? item.variant_title : '';
                const itemTotal = item.total ?? (item.unit_price * item.quantity);
                return (
                  <div className="sline" style={{ marginBottom: 14 }} key={item.id}>
                    <div className="sline__media">
                      <img src={item.thumbnail || '/images/hero-shoe.png'} alt={item.title || ''} />
                      <span className="sline__n">{item.quantity}</span>
                    </div>
                    <div>
                      <p className="sline__name">{item.product_title || item.title}</p>
                      {vTitle ? <p className="sline__meta">{vTitle}</p> : null}
                    </div>
                    <p className="sline__price">{formatPrice(itemTotal, currency)}</p>
                  </div>
                );
              })}
              <div className="sumrow sumrow--total" style={{ borderTop: '1px solid var(--line)' }}>
                <span>Total due on delivery</span>
                <b className="conf__total">{formatPrice(order.total, currency)}</b>
              </div>
            </div>
          )}

          <div className="conf__acts">
            <Link className="btn btn--dark btn--wide" href="/shop">Continue shopping</Link>
            <Link className="btn btn--ghost" href="/account">View my orders</Link>
          </div>
        </div>
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
