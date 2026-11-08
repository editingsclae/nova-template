'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { Chev } from '@/components/icons';
import { useCart } from '@/lib/cart';
import {
  getCustomer,
  getCustomerOrders,
  getOrder,
  getEmailVerification,
  sendEmailVerification,
  confirmEmailVerification,
  claimOrders,
  formatPrice,
  cleanVariantTitle,
  countryName,
} from '@/lib/medusa';

function dateOf(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function getDerivedStatus(order) {
  if (order.status === 'canceled') return 'Canceled';
  if (order.fulfillment_status === 'delivered') return 'Delivered';
  if (order.fulfillment_status === 'shipped') return 'Shipped';
  return 'Order placed';
}

const Tick = ({ size = 13 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
const Clock = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 1.8" /></svg>
);

function OrderDetail({ orderId, token }) {
  const router = useRouter();
  const { clear, closeDrawer } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const authToken =
      token ||
      (typeof window !== 'undefined' ? localStorage.getItem('medusa_token') : null);
    try {
      const data = await getOrder(orderId, authToken);
      if (!data) throw new Error('Order details not found.');
      setOrder(data);
    } catch (err) {
      console.error('[order-detail] Fetch error:', err);
      if (err?.status === 401) {
        try {
          localStorage.removeItem('medusa_token');
        } catch (e) {}
        closeDrawer();
        clear();
        router.push('/account/login');
        return;
      }
      setError(err?.message || 'Could not load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      load();
    }
  }, [orderId, token]);

  if (loading) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-2)' }}>
        Loading order details…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <p style={{ color: '#b3261e', fontSize: '13px', marginBottom: 10 }}>
          {error || 'Failed to load order details.'}
        </p>
        <button className="btn btn--ghost btn--sm" type="button" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const a = order.shipping_address || {};
  const street = [a.address_1, a.address_2].filter(Boolean).join(', ');
  const country = countryName(a.country_code);
  const items = Array.isArray(order.items) ? order.items : [];
  const currency = order.currency_code || 'tnd';
  const shipMethod = order.shipping_methods?.[0]?.name?.trim() || '';
  const derivedStatus = getDerivedStatus(order);

  const subtotal =
    order.item_subtotal ??
    items.reduce((acc, i) => acc + (i.total ?? i.unit_price * i.quantity), 0);

  return (
    <div className="odetail__grid">
      <div className="oitems">
        <h3>Items ({items.length})</h3>
        {items.map((l, k) => {
          const itemTotal = l.total ?? l.unit_price * l.quantity;
          const vTitle = cleanVariantTitle(l.variant_title);
          return (
            <div className="oline" key={l.id || k}>
              <div className="sline__media">
                <img src={l.thumbnail || '/images/hero-shoe.png'} alt="" />
                <span className="sline__n">{l.quantity}</span>
              </div>
              <div>
                <p className="sline__name">{l.product_title || l.title || 'Product'}</p>
                <p className="oline__meta">
                  Qty: {l.quantity} • Unit: {formatPrice(l.unit_price, currency)}
                  {vTitle ? ` • ${vTitle}` : ''}
                </p>
              </div>
              <p className="sline__price">{formatPrice(itemTotal, currency)}</p>
            </div>
          );
        })}
      </div>

      <div>
        <h3>Shipping Information</h3>
        {a.first_name || a.last_name || street || a.city || a.postal_code || country ? (
          <address className="oaddr">
            {a.first_name || a.last_name ? (
              <>
                {[a.first_name, a.last_name].filter(Boolean).join(' ')}
                <br />
              </>
            ) : null}
            {street ? (
              <>
                {street}
                <br />
              </>
            ) : null}
            {a.city || a.postal_code ? (
              <>
                {a.city}
                {a.postal_code ? `, ${a.postal_code}` : ''}
                {country ? <br /> : ''}
              </>
            ) : null}
            {country || null}
          </address>
        ) : null}
        <dl className="okv">
          {shipMethod ? (
            <div>
              <dt>Method</dt>
              <dd>{shipMethod}</dd>
            </div>
          ) : null}
          {a.phone ? (
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={'tel:' + a.phone.replace(/\D/g, '')}>{a.phone}</a>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div>
        <h3>Payment &amp; Fulfillment</h3>
        <dl className="okv">
          <div>
            <dt>Payment</dt>
            <dd>Cash on delivery</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{derivedStatus}</dd>
          </div>
          {order.email ? (
            <div>
              <dt>Contact</dt>
              <dd>
                <a href={'mailto:' + order.email}>{order.email}</a>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div>
        <h3>Payment breakdown</h3>
        <div className="oledger">
          <div className="sumrow">
            <span>Items:</span>
            <b>{formatPrice(subtotal, currency)}</b>
          </div>
          {order.shipping_subtotal != null ? (
            <div className="sumrow">
              <span>Shipping:</span>
              <b>
                {order.shipping_subtotal === 0
                  ? 'Free'
                  : formatPrice(order.shipping_subtotal, currency)}
              </b>
            </div>
          ) : null}
          {order.tax_total != null && order.tax_total > 0 ? (
            <div className="sumrow">
              <span>Tax:</span>
              <b>{formatPrice(order.tax_total, currency)}</b>
            </div>
          ) : null}
          <div className="sumrow sumrow--total">
            <span>Total:</span>
            <b>{formatPrice(order.total, currency)}</b>
          </div>
        </div>
        <p className="ck__legal">
          Cash on delivery — hand the courier <b>{formatPrice(order.total, currency)}</b> when
          the parcel arrives. Nothing has been charged online.
        </p>
      </div>
    </div>
  );
}

export default function AccountView() {
  const router = useRouter();
  const { clear, closeDrawer } = useCart();
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pane, setPane] = useState('profile');
  const [open, setOpen] = useState(null);

  // Email verification state (Rule 28)
  const [isVerified, setIsVerified] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [canResendIn, setCanResendIn] = useState(0);

  const countdownTimer = useRef(null);

  const startCountdown = (sec = 60) => {
    clearInterval(countdownTimer.current);
    setCanResendIn(sec);
    countdownTimer.current = setInterval(() => {
      setCanResendIn((s) => {
        if (s <= 1) {
          clearInterval(countdownTimer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(countdownTimer.current), []);

  // Check auth and load customer & orders on mount
  useEffect(() => {
    // Rule 11: Expire legacy cookie if present
    try {
      document.cookie = 'medusa_customer_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e) {}

    const token = typeof window !== 'undefined' ? localStorage.getItem('medusa_token') : null;
    if (!token) {
      router.push('/account/login');
      return;
    }
    setToken(token);

    Promise.all([
      getCustomer(token),
      getCustomerOrders(token),
      getEmailVerification(token).catch(() => null),
    ])
      .then(async ([cust, orderList, vInfo]) => {
        if (!cust) {
          localStorage.removeItem('medusa_token');
          closeDrawer();
          clear();
          router.push('/account/login');
          return;
        }

        setCustomer(cust);

        // Sort orders newest first
        const sorted = (Array.isArray(orderList) ? orderList : []).slice().sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setOrders(sorted);

        // Email verification status
        if (vInfo?.verified) {
          setIsVerified(true);
          // Rule 18: Claim guest orders when verified
          try {
            await claimOrders(token);
            const refreshed = await getCustomerOrders(token);
            setOrders(refreshed.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
          } catch (e) {}
        } else {
          setIsVerified(false);
          if (vInfo?.can_resend_in > 0) {
            startCountdown(vInfo.can_resend_in);
          }
        }

        const hash = (window.location.hash || '').replace('#', '');
        if (hash.startsWith('order-')) {
          setOpen(+hash.slice(6));
          setPane('orders');
        } else if (hash === 'orders') {
          setPane('orders');
        }
      })
      .catch((err) => {
        console.error('[account] Load error:', err);
        localStorage.removeItem('medusa_token');
        closeDrawer();
        clear();
        router.push('/account/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const showPane = (which) => {
    setPane(which);
    try {
      window.history.replaceState(null, '', '#' + which);
    } catch (e) {}
  };

  const onTabKeys = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = e.target.getAttribute('data-pane') === 'profile' ? 'orders' : 'profile';
    showPane(next);
    document.getElementById('tab-' + next)?.focus();
  };

  const handleConfirmCode = async (e) => {
    e.preventDefault();
    setVerifyError('');
    setVerifySuccess('');

    const token = typeof window !== 'undefined' ? localStorage.getItem('medusa_token') : null;
    const cleanCode = verifyCode.replace(/\D/g, '');

    if (!token || cleanCode.length !== 6) {
      setVerifyError('Please enter the 6-digit verification code.');
      return;
    }

    setVerifying(true);
    try {
      await confirmEmailVerification(token, cleanCode);
      setIsVerified(true);
      setVerifySuccess('Email confirmed successfully!');
      setVerifyCode('');

      // Rule 18: Claim orders after email confirmed
      try {
        await claimOrders(token);
        const refreshed = await getCustomerOrders(token);
        setOrders(refreshed.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (err) {}
    } catch (err) {
      console.error('[verify] Confirm error:', err);
      if (err?.status === 401) {
        try {
          localStorage.removeItem('medusa_token');
        } catch (e) {}
        closeDrawer();
        clear();
        router.push('/account/login');
        return;
      }
      const msg = err?.data?.message || err?.message || 'That code is not right or has expired.';
      setVerifyError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setVerifyError('');
    setVerifySuccess('');
    const token = typeof window !== 'undefined' ? localStorage.getItem('medusa_token') : null;
    if (!token) return;

    setResending(true);
    try {
      const res = await sendEmailVerification(token);
      if (res?.verified) {
        setIsVerified(true);
      } else {
        startCountdown(res?.can_resend_in || 60);
        setVerifySuccess('A new verification code has been sent to your email.');
      }
    } catch (err) {
      console.error('[verify] Resend error:', err);
      if (err?.status === 401) {
        try {
          localStorage.removeItem('medusa_token');
        } catch (e) {}
        closeDrawer();
        clear();
        router.push('/account/login');
        return;
      }
      const msg = err?.data?.message || err?.message || 'Could not send verification code.';
      setVerifyError(msg);
    } finally {
      setResending(false);
    }
  };

  const signOut = () => {
    // Rule 31: Logout clears saved customer token and cart
    try {
      localStorage.removeItem('medusa_token');
      localStorage.removeItem('medusa_cart_id');
      localStorage.removeItem('nova.session');
      localStorage.removeItem('nova.remembered');
      document.cookie = 'medusa_customer_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e) {}
    closeDrawer();
    clear();
    router.push('/account/login');
  };

  if (loading) {
    return (
      <div className="shop">
        <SiteHeader />
        <main className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--sub, #666)' }}>Loading your account…</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const fullName = customer
    ? [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email
    : 'Member';

  return (
    <div className="shop">
      <SiteHeader />

      <main className="container">
        <div className="pagehead">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><Chev />
            <span>Account</span>
          </nav>
          <h1>Your account</h1>
          <p>Your details, the orders you've placed and the cash amount waiting for the courier at your door.</p>
        </div>

        <div className="ac__layout">
          <aside className="ac__side">
            <div className="ac__who">
              <span className="ac__avatar">{initialsOf(fullName)}</span>
              <div>
                <p className="ac__who-name">{fullName}</p>
                <p className="ac__who-mail">{customer?.email}</p>
              </div>
            </div>

            <nav className="ac__tabs" role="tablist" aria-label="Account sections" onKeyDown={onTabKeys}>
              <button
                className={'ac__tab' + (pane === 'profile' ? ' is-on' : '')}
                type="button"
                role="tab"
                aria-selected={pane === 'profile'}
                aria-controls="pane-profile"
                id="tab-profile"
                data-pane="profile"
                onClick={() => showPane('profile')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
                Profile
              </button>
              <button
                className={'ac__tab' + (pane === 'orders' ? ' is-on' : '')}
                type="button"
                role="tab"
                aria-selected={pane === 'orders'}
                aria-controls="pane-orders"
                id="tab-orders"
                data-pane="orders"
                onClick={() => showPane('orders')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9.5 8a2.5 2.5 0 0 1 5 0" /></svg>
                My orders
                <span className="ac__tab-n">{orders.length}</span>
              </button>
            </nav>

            <div className="ac__side-foot">
              <button className="btn btn--ghost btn--block" type="button" onClick={signOut}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" /></svg>
                Sign out
              </button>
              <Link className="ac__side-link" href="/shop">Continue shopping</Link>
            </div>
          </aside>

          <div className="ac__main">
            <section
              className="panel ac__pane"
              id="pane-profile"
              role="tabpanel"
              aria-labelledby="tab-profile"
              hidden={pane !== 'profile'}
            >
              <div className="panel__head">
                <h2>Profile</h2>
              </div>

              <dl className="ac__facts">
                <div className="ac__fact">
                  <dt>User full name</dt>
                  <dd>
                    {fullName}
                    <small>Shown on the delivery label and read out to the courier.</small>
                  </dd>
                </div>
                <div className="ac__fact">
                  <dt>Email</dt>
                  <dd>
                    {customer?.email}
                    <small>Order confirmations and tracking links go here.</small>
                  </dd>
                </div>
                <div className="ac__fact">
                  <dt>Email confirmed</dt>
                  {isVerified ? (
                    <dd>
                      <span className="pill pill--ok"><Tick />Confirmed</span>
                      <small>Your email address has been verified.</small>
                    </dd>
                  ) : (
                    <dd>
                      <span className="pill pill--wait"><Clock />Awaiting confirmation</span>
                      <div style={{ marginTop: 14, padding: '1.25rem', background: '#f9f9f8', border: '1px solid var(--line, #e5e5e4)', borderRadius: 8, maxWidth: 420 }}>
                        <p style={{ fontSize: '0.875rem', marginBottom: 10, color: 'var(--sub, #555)', lineHeight: 1.4 }}>
                          Enter the 6-digit confirmation code sent to <b>{customer?.email}</b>:
                        </p>
                        <form onSubmit={handleConfirmCode} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="123456"
                            maxLength="8"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.replace(/[^\d]/g, ''))}
                            style={{ width: 130, padding: '7px 12px', fontSize: '1rem', letterSpacing: '0.15em', fontWeight: 600, border: '1px solid #ccc', borderRadius: 6 }}
                          />
                          <button
                            className="btn btn--dark"
                            type="submit"
                            disabled={verifying || verifyCode.trim().length !== 6}
                            style={{ padding: '7px 16px', fontSize: '0.875rem' }}
                          >
                            {verifying ? 'Checking…' : 'Confirm'}
                          </button>
                        </form>
                        {verifyError && (
                          <p style={{ color: '#dc2626', fontSize: '0.8125rem', margin: '4px 0 8px' }}>
                            {verifyError}
                          </p>
                        )}
                        {verifySuccess && (
                          <p style={{ color: '#16a34a', fontSize: '0.8125rem', margin: '4px 0 8px' }}>
                            {verifySuccess}
                          </p>
                        )}
                        <div style={{ fontSize: '0.8125rem', color: '#666', marginTop: 4 }}>
                          {canResendIn > 0 ? (
                            <span>Resend available in {canResendIn}s</span>
                          ) : (
                            <button
                              type="button"
                              className="linkbtn"
                              onClick={handleResendCode}
                              disabled={resending}
                              style={{ textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit' }}
                            >
                              {resending ? 'Sending…' : 'Resend code'}
                            </button>
                          )}
                        </div>
                      </div>
                    </dd>
                  )}
                </div>
              </dl>
            </section>

            <section
              className="panel ac__pane"
              id="pane-orders"
              role="tabpanel"
              aria-labelledby="tab-orders"
              hidden={pane !== 'orders'}
            >
              <div className="panel__head">
                <h2>My orders</h2>
                <p className="panel__head-note">
                  {orders.length ? `${dateOf(orders[0].created_at)} · newest first` : ''}
                </p>
              </div>

              {orders.length > 0 ? (
                <div className="oorder-list">
                  {orders.map((o, i) => {
                    const displayId = o.display_id ? String(o.display_id) : o.id;
                    const items = Array.isArray(o.items) ? o.items : [];
                    const itemCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
                    const derivedStatus = getDerivedStatus(o);

                    return (
                      <div className="oorder" key={o.id || displayId}>
                        <button
                          className="oorder__btn"
                          type="button"
                          aria-expanded={open === i}
                          aria-controls={'detail-' + i}
                          onClick={() => setOpen(open === i ? null : i)}
                        >
                          <span className="oorder__no">Order #{displayId}</span>
                          <span className="oorder__items">
                            {dateOf(o.created_at)} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>
                          <span className="oorder__status">
                            <span className="pill pill--ok"><Tick />{derivedStatus}</span>
                          </span>
                          <span className="oorder__total">
                            <small>Total</small>
                            {formatPrice(o.total, o.currency_code)}
                          </span>
                          <span className="oorder__chev"><Chev size={13} /></span>
                        </button>
                        <div
                          className="odetail"
                          id={'detail-' + i}
                          role="region"
                          aria-label={'Order ' + displayId + ' details'}
                          hidden={open !== i}
                        >
                          {open === i ? <OrderDetail orderId={o.id} token={token} /> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="ac__noorders">
                  <h3>No orders yet</h3>
                  <p>When you place an order it appears here with its cash-on-delivery amount and courier details.</p>
                  <Link className="btn btn--dark" href="/shop">Browse the shop</Link>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
