'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { TickPlain } from '@/components/icons';
import { useCart } from '@/lib/cart';
import { getOrder, formatPrice, cleanVariantTitle, countryName, getDerivedOrderStatus } from '@/lib/medusa';

function ConfirmedSkeleton() {
  const block = (w, h, extra = {}) => ({
    width: w,
    height: h,
    background: 'var(--line, #e5e5e4)',
    borderRadius: 4,
    ...extra,
  });

  return (
    <main className="container">
      <div className="conf">
        <div className="conf__card" aria-busy="true" aria-label="Loading order details">
          <div className="conf__tick" style={{ background: 'var(--bg-light, #f6f5f3)', borderColor: 'var(--line, #e5e5e4)' }}>
            <div style={block(24, 24, { borderRadius: 12, opacity: 0.5 })} />
          </div>
          <div style={block(200, 32, { margin: '0 auto', borderRadius: 6 })} />
          <div style={block(320, 16, { margin: '14px auto 0', maxWidth: '80%' })} />

          <div className="conf__grid">
            <div>
              <p className="conf__k">Order number</p>
              <div style={block(120, 20)} />
            </div>
            <div>
              <p className="conf__k">Status</p>
              <div style={block(90, 20)} />
            </div>
            <div>
              <p className="conf__k">Ship to</p>
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={block(130, 16)} />
                <div style={block(160, 16)} />
                <div style={block(110, 16)} />
              </div>
            </div>
            <div>
              <p className="conf__k">Payment</p>
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={block(120, 16)} />
                <div style={block(150, 16)} />
              </div>
            </div>
          </div>

          <div className="conf__items">
            <h2>Your items</h2>
            <div className="sline" style={{ marginBottom: 14 }}>
              <div className="sline__media" style={{ background: 'var(--line, #e5e5e4)' }} />
              <div>
                <div style={block(180, 16, { marginBottom: 6 })} />
                <div style={block(100, 14)} />
              </div>
              <div style={block(70, 18, { marginLeft: 'auto' })} />
            </div>
            <div className="sumrow sumrow--total" style={{ borderTop: '1px solid var(--line)' }}>
              <span>Total due on delivery</span>
              <div style={block(90, 24)} />
            </div>
          </div>

          <div className="conf__acts">
            <div style={block(160, 42, { borderRadius: 8 })} />
            <div style={block(140, 42, { borderRadius: 8 })} />
          </div>
        </div>
      </div>
    </main>
  );
}

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const { clear, closeDrawer } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const clearedRef = useRef(false);

  useEffect(() => {
    if (orderId && !clearedRef.current) {
      clearedRef.current = true;
      clear();
    }
  }, [orderId, clear]);

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
        if (e?.status === 401) {
          try {
            localStorage.removeItem('medusa_token');
          } catch (err) {}
          closeDrawer?.();
          clear();
        }
        setError('Could not load order details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId, clear, closeDrawer]);

  if (loading) {
    return <ConfirmedSkeleton />;
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
  const statusText = getDerivedOrderStatus(order);
  const isCanceled = statusText === 'Canceled';

  const displayId = order.display_id ? String(order.display_id) : orderId;
  const addr = order.shipping_address || {};
  const currency = order.currency_code || 'tnd';

  return (
    <main className="container">
      <div className="conf">
        <div className="conf__card">
          <div className="conf__tick"><TickPlain /></div>
          <h1>{isCanceled ? 'Order canceled' : 'Order placed'}</h1>
          <p className="conf__lede">
            {isCanceled ? (
              'This order was canceled.'
            ) : (
              <>
                We've emailed a confirmation to <b>{order.email}</b>.
                {addr.phone ? (
                  <> The courier will call <b>{addr.phone}</b> before arriving.</>
                ) : null}
              </>
            )}
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
                {[addr.first_name, addr.last_name].filter(Boolean).join(' ')}<br />
                {addr.address_1}
                {addr.address_2 ? <><br />{addr.address_2}</> : null}<br />
                {[addr.city, addr.postal_code].filter(Boolean).join(' ')}
                {countryName(addr.country_code) ? <><br />{countryName(addr.country_code)}</> : null}
              </p>
            </div>
            <div>
              <p className="conf__k">Payment</p>
              <p className="conf__v">
                {isCanceled ? 'No payment due' : (
                  <>Cash on delivery<br />
                  <b>{formatPrice(order.total, currency)}</b> due when the parcel arrives</>
                )}
              </p>
            </div>
          </div>

          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="conf__items">
              <h2>Your items</h2>
              {order.items.map((item) => {
                const vTitle = cleanVariantTitle(item.variant_title);
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
      <Suspense fallback={<ConfirmedSkeleton />}>
        <ConfirmedContent />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
