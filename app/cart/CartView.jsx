'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { Chev } from '@/components/icons';
import { MAX_QTY, useCart } from '@/lib/cart';
import { CAT_LABEL, SIZES, byId, money, productUrl } from '@/lib/nova';

const NOTE_KEY = 'nova.note';

const Bag = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5h11v10H2zM13 10h5l3 3v3.5h-8" /><circle cx="6" cy="18.5" r="1.8" /><circle cx="17" cy="18.5" r="1.8" /></svg>
);

export default function CartView() {
  const { lines, totals, setQty, setSize, remove, clear } = useCart();
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

  /* two-step clear so a stray click can't wipe a basket */
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
          <p>Check sizes and quantities below. Nothing is charged now — you pay the courier in cash when your pair arrives.</p>

          <div className="steps" aria-label="Checkout progress">
            <span className="step step--on"><i>1</i><span className="step__label">Cart</span></span>
            <span className="step__rule step__rule--on" />
            <span className="step"><i>2</i><span className="step__label">Contact &amp; address</span></span>
            <span className="step__rule" />
            <span className="step"><i>3</i><span className="step__label">Shipping &amp; payment</span></span>
          </div>
        </div>

        <div className="cart__layout" hidden={!has}>
          <div>
            <div className="cart__items">
              {lines.map((l) => (
                <div className={'citem' + (l.stock ? '' : ' citem--out')} key={l.i}>
                  <div className="citem__media"><img src={'/images/' + l.img + '.png'} alt={l.name} /></div>

                  <div className="citem__info">
                    <div className="citem__top">
                      <div>
                        <h3><Link className="plink" href={productUrl(l.id)}>{l.name}</Link></h3>
                        <p className="citem__sub">{l.sub} · {CAT_LABEL[byId(l.id).cat]}</p>
                      </div>
                      <button className="citem__rm" type="button" data-name={l.name}
                              onClick={() => remove(l.i)}>Remove</button>
                    </div>
                    <p className="citem__unit">{money(l.price)} <span>/ pair</span></p>
                    {!l.stock
                      ? <p className="citem__flag">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5m0 3.2v.3" /></svg>
                          Out of stock — remove to check out
                        </p>
                      : null}
                    <div className="citem__ctrl">
                      <div className="sizes">
                        <span className="sizes__label">Size</span>
                        <div className="control">
                          <select value={l.size} aria-label={'Size for ' + l.name}
                                  onChange={(e) => setSize(l.i, e.target.value)}>
                            {SIZES.map((s) => <option value={s} key={s}>EU {s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="qty qty--lg">
                        <button type="button" aria-label="Decrease quantity" disabled={l.qty <= 1}
                                onClick={() => setQty(l.i, l.qty - 1)}>−</button>
                        <span>{l.qty}</span>
                        <button type="button" aria-label="Increase quantity" disabled={l.qty >= MAX_QTY}
                                onClick={() => setQty(l.i, l.qty + 1)}>+</button>
                      </div>
                    </div>
                  </div>

                  <div className="citem__right">
                    <p className="citem__total">{money(l.line)}</p>
                    <p className="citem__sub">{l.qty} {l.qty === 1 ? 'pair' : 'pairs'}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart__meta">
              <p><Bag /> Free returns within 30 days · Dispatched from Tunis within 24 hours</p>
              <button type="button" className="linkbtn" style={armed ? { color: '#b3261e' } : undefined} onClick={onClear}>
                {armed ? 'Click again to clear everything' : 'Clear cart'}
              </button>
            </div>
          </div>

          <aside className="cart__aside">
            <div className="sumcard">
              <h2>Order summary</h2>
              <div className="sumrow"><span>Subtotal <em>({n} {n === 1 ? 'item' : 'items'})</em></span><b>{money(t.subtotal)}</b></div>
              <div className="sumrow"><span>{t.method.label} delivery <em>3–5 working days</em></span>
                <b>{money(t.shipping)}</b></div>
              <div className="sumrow"><span>Cash on delivery</span><b>Included</b></div>
              <div className="sumrow sumrow--total"><span>Estimated total</span><b>{money(t.total)}</b></div>
              <div className="sumcard__ship">
                <Bag />
                <span>One flat <b>{money(t.shipping)}</b> delivery charge anywhere in Tunisia, collected by the <b>{t.method.label}</b> courier on arrival.</span>
              </div>
              <Link className="btn btn--dark btn--block" href="/checkout">Proceed to checkout</Link>
            </div>

            <div className="notecard">
              <h3>Order note for the courier</h3>
              <div className="control">
                <textarea rows="3" value={note} placeholder="Landmark, gate code, best time to call…" onChange={onNote} />
              </div>
              <p className="hint">Saved on this device and printed on the delivery slip.</p>
            </div>
          </aside>
        </div>

        <div className="cartempty" hidden={has}>
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9.5 8a2.5 2.5 0 0 1 5 0" /></svg>
          <h2>Nothing in your cart yet</h2>
          <p>Add a pair and it will appear here — sizes and quantities stay editable until you place the order.</p>
          <Link className="btn btn--dark" href="/shop">Browse the shop</Link>
        </div>

        <div className="cart__foot" hidden={!has}>
          <Link className="btn btn--ghost" href="/shop">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
            Continue shopping
          </Link>
          <p style={{ fontSize: '12.5px', color: 'var(--muted-2)' }}>
            Prices include VAT. Every order you place is saved to{' '}
            <Link href="/account" style={{ color: 'var(--ink)', fontWeight: 600, borderBottom: '1px solid var(--line)' }}>your account</Link>.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
