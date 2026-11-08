'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { Chev } from '@/components/icons';
import { MAX_QTY, useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/medusa';
import { productUrl } from '@/lib/nova';

const NOTE_KEY = 'nova.note';

const Bag = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5h11v10H2zM13 10h5l3 3v3.5h-8" /><circle cx="6" cy="18.5" r="1.8" /><circle cx="17" cy="18.5" r="1.8" /></svg>
);

export default function CartView() {
  const { lines, totals, setQty, remove, clear } = useCart();
  const [armed, setArmed] = useState(false);
  const [note, setNote] = useState('');
  const armTimer = useRef(null);

  useEffect(() => {
    try { setNote(localStorage.getItem(NOTE_KEY) || ''); } catch (e) { /* private mode */ }
  }, []);

  const onNote = (e) => {
    const v = e.target.value.slice(0, 300);
    setNote(v);
    try { localStorage.setItem(NOTE_KEY, v); } catch (e) { /* ignore */ }
  };

  /* two-step clear */
  const onClear = () => {
    if (!armed) {
      setArmed(true);
      clearTimeout(armTimer.current);
      armTimer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    clearTimeout(armTimer.current);
    setArmed(false);
    clear();
  };

  const has = lines.length > 0;
  const t = totals();
  const n = lines.reduce((a, l) => a + l.qty, 0);
  const curr = t.currencyCode;

  return (
    <div className="shop">
      <SiteHeader />

      <main className="container">
        <div className="pagehead">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <Chev />
            <span>Cart</span>
          </nav>
          <h1>Your cart</h1>
          <p>Check your pairs and quantities below. Nothing is charged online — you pay in cash when your delivery arrives.</p>

          <div className="steps" aria-label="Checkout progress">
            <span className="step step--on"><i>1</i><span className="step__label">Cart</span></span>
            <span className="step__rule step__rule--on" />
            <span className="step"><i>2</i><span className="step__label">Contact &amp; address</span></span>
            <span className="step__rule" />
            <span className="step"><i>3</i><span className="step__label">Shipping &amp; payment</span></span>
          </div>
        </div>

        {!has ? (
          <div className="cartempty" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9.5 8a2.5 2.5 0 0 1 5 0" />
            </svg>
            <h2>Your cart is empty</h2>
            <p>Explore our latest silhouettes and add a pair to your cart.</p>
            <Link className="btn btn--dark" href="/shop" style={{ marginTop: 16 }}>Start shopping</Link>
          </div>
        ) : (
          <div className="cart__layout">
            <div>
              <div className="cart__items">
                {lines.map((l) => {
                  const imgSrc = l.img?.startsWith('http') || l.img?.startsWith('/')
                    ? l.img
                    : '/images/' + l.img + '.png';

                  return (
                    <div className={'citem' + (l.stock ? '' : ' citem--out')} key={l.lineId}>
                      <div className="citem__media">
                        <img src={imgSrc || '/images/hero-shoe.png'} alt={l.name} />
                      </div>

                      <div className="citem__info">
                        <div className="citem__top">
                          <div>
                            <h3>
                              <Link className="plink" href={productUrl(l.handle || l.productId)}>
                                {l.name}
                              </Link>
                            </h3>
                            {l.variantTitle && (
                              <p className="citem__sub">{l.variantTitle}</p>
                            )}
                          </div>
                          <button
                            className="citem__rm"
                            type="button"
                            data-name={l.name}
                            onClick={() => remove(l.lineId)}
                          >
                            Remove
                          </button>
                        </div>
                        <p className="citem__unit">
                          {formatPrice(l.price, curr)} <span>/ pair</span>
                        </p>
                        {l.error && (
                          <p className="citem__flag" style={{ color: '#ef4444' }}>
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5m0 3.2v.3" /></svg>
                            {l.error}
                          </p>
                        )}
                        <div className="citem__ctrl">
                          <div className="qty qty--lg">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              disabled={l.qty <= 1}
                              onClick={() => setQty(l.lineId, l.qty - 1)}
                            >
                              −
                            </button>
                            <span>{l.qty}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={l.qty >= MAX_QTY}
                              onClick={() => setQty(l.lineId, l.qty + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="citem__right">
                        <p className="citem__total">{formatPrice(l.line, curr)}</p>
                        <p className="citem__sub">{l.qty} {l.qty === 1 ? 'pair' : 'pairs'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart__meta">
                <p><Bag /> Cash on delivery across Tunisia · Dispatched promptly</p>
                <button type="button" className="linkbtn" style={armed ? { color: '#b3261e' } : undefined} onClick={onClear}>
                  {armed ? 'Click again to clear everything' : 'Clear cart'}
                </button>
              </div>
            </div>

            <aside className="cart__aside">
              <div className="sumcard">
                <h2>Order summary</h2>
                <div className="sumrow">
                  <span>Subtotal <em>({n} {n === 1 ? 'item' : 'items'})</em></span>
                  <b>{formatPrice(t.subtotal, curr)}</b>
                </div>
                <div className="sumrow">
                  <span>Delivery</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="sumrow">
                  <span>Payment</span>
                  <b>Cash on delivery</b>
                </div>
                <div className="sumrow sumrow--total">
                  <span>Subtotal</span>
                  <b>{formatPrice(t.subtotal, curr)}</b>
                </div>
                <div className="sumcard__ship">
                  <Bag />
                  <span>Delivery fee is calculated at checkout and collected in cash upon arrival.</span>
                </div>
                <Link className="btn btn--dark btn--block" href="/checkout">
                  Proceed to checkout
                </Link>
              </div>

              <div className="notecard">
                <h3>Order note for the courier (optional)</h3>
                <div className="control">
                  <textarea
                    rows={3}
                    placeholder="e.g. Please call before delivery, deliver after 2 PM..."
                    value={note}
                    onChange={onNote}
                  />
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
