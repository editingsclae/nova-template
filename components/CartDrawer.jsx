'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart';
import { formatPrice, cleanVariantTitle } from '@/lib/medusa';
import { productUrl } from '@/lib/nova';
import { Truck, X } from './icons';

export default function CartDrawer() {
  const { lines, count, subtotal, totals, setQty, remove, drawerOpen, closeDrawer, MAX_QTY } = useCart();
  const closeBtn = useRef(null);
  const panel = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return;
    if (closeBtn.current) closeBtn.current.focus();
    function onKey(e) {
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = panel.current.querySelectorAll('button:not([disabled]), a[href], input, select');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  const t = totals();
  const curr = t.currencyCode;

  return (
    <div className={'drawer' + (drawerOpen ? ' is-open' : '')}>
      <div className="drawer__scrim" onClick={closeDrawer} />
      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawerTitle"
        ref={panel}>
        <header className="drawer__head">
          <h2 id="drawerTitle">Your cart <span>({count})</span></h2>
          <button className="drawer__x" type="button" aria-label="Close cart" onClick={closeDrawer} ref={closeBtn}>
            <X size={14} width={2.2} />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="drawer__body drawer__body--empty">
            <div className="dempty">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9.5 8a2.5 2.5 0 0 1 5 0" />
              </svg>
              <h3>Your cart is empty</h3>
              <p>Add a pair and they&rsquo;ll show up here.</p>
              <Link className="btn btn--dark" href="/shop" onClick={closeDrawer}>Start shopping</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="drawer__ship">
              <Truck />
              <div className="drawer__ship-text">
                <span>Cash on delivery across Tunisia. Shipping is calculated at checkout.</span>
              </div>
            </div>

            <div className="drawer__body">
              {lines.map((l) => {
                const imgSrc = l.img?.startsWith('http') || l.img?.startsWith('/')
                  ? l.img
                  : '/images/' + l.img + '.png';

                return (
                  <div className={'dline' + (l.stock ? '' : ' dline--out')} key={l.lineId}>
                    <div className="dline__media">
                      <img src={imgSrc || '/images/hero-shoe.png'} alt={l.name} />
                    </div>
                    <div className="dline__info">
                      <h3>
                        <Link className="plink" href={productUrl(l.handle || l.productId)} onClick={closeDrawer}>
                          {l.name}
                        </Link>
                      </h3>
                      {cleanVariantTitle(l.variantTitle) ? (
                        <p className="dline__meta">{cleanVariantTitle(l.variantTitle)}</p>
                      ) : null}
                      <div className="qty qty--sm">
                        <button type="button" aria-label="Decrease quantity" disabled={l.qty <= 1} onClick={() => setQty(l.lineId, l.qty - 1)}>&minus;</button>
                        <span aria-live="polite">{l.qty}</span>
                        <button type="button" aria-label="Increase quantity" disabled={l.qty >= MAX_QTY} onClick={() => setQty(l.lineId, l.qty + 1)}>+</button>
                      </div>
                      {l.error && (
                        <p className="err-hint">
                          {l.error}
                        </p>
                      )}
                    </div>
                    <div className="dline__side">
                      <p className="dline__price">{formatPrice(l.line, curr)}</p>
                      <button className="dline__rm" type="button" onClick={() => remove(l.lineId)}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="drawer__foot">
              <div className="drawer__row"><span>Subtotal</span><b>{formatPrice(subtotal, curr)}</b></div>
              <p className="drawer__note">Shipping and delivery fees are calculated at checkout.</p>
              <div className="drawer__cta">
                <Link className="btn btn--ghost btn--ghost-lg" href="/cart" onClick={closeDrawer}>View cart</Link>
                <Link className="btn btn--dark" href="/checkout" onClick={closeDrawer}>Checkout</Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
