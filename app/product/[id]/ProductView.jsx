'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { Chev } from '@/components/icons';
import { MAX_QTY, useCart } from '@/lib/cart';
import { CAT_LABEL, PRODUCTS, SHIPPING, SIZES, gallery, money, productUrl } from '@/lib/nova';

const FIT = {
  mens: 'True to size. Wear them in and out all day — the padded collar holds the heel from the first mile.',
  womens: 'Runs a touch generous. If you are between two sizes, take the smaller one for a snugger ride.',
  running: 'Performance fit: snug through the midfoot with room at the toe box. Size up for racing socks.',
  lifestyle: 'Easy slip-on fit with a soft tongue. Take your usual size.'
};

const Tick = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);

export default function ProductView({ product, frames, initialFrame, initialSize }) {
  const router = useRouter();
  const { add, openDrawer } = useCart();

  const multi = frames.length > 1;
  const [fi, setFi] = useState(initialFrame);
  const [size, setSize] = useState(initialSize);
  const [qty, setQty] = useState(1);
  const [lbOpen, setLbOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [acc, setAcc] = useState([true, false]);
  const [msg, setMsg] = useState(null);

  const stage = useRef(null);
  const zoomBtn = useRef(null);
  const addBtn = useRef(null);
  const sizeGuide = useRef(null);
  const lbReturn = useRef(null);
  const canHover = useRef(false);
  const msgTimer = useRef(null);

  useEffect(() => {
    canHover.current = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  }, []);

  const showFrame = useCallback((i) => {
    if (!multi) { setFi(0); return; }
    setFi(((i % frames.length) + frames.length) % frames.length);
  }, [multi, frames]);

  /* lightbox + size sheet share the body scroll lock */
  useEffect(() => {
    if (lbOpen || sheetOpen) document.documentElement.classList.add('drawer-open');
    return () => document.documentElement.classList.remove('drawer-open');
  }, [lbOpen, sheetOpen]);

  const openLb = () => {
    lbReturn.current = document.activeElement;
    setLbOpen(true);
  };
  const closeLb = () => {
    setLbOpen(false);
    const back = lbReturn.current && lbReturn.current !== document.body ? lbReturn.current : zoomBtn.current;
    if (back && back.focus) back.focus();
  };
  const closeSheet = () => {
    setSheetOpen(false);
    sizeGuide.current?.focus();
  };

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (lbOpen) closeLb();
        if (sheetOpen) closeSheet();
        return;
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
      if (!multi) return;
      showFrame(fi + (e.key === 'ArrowRight' ? 1 : -1));
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  /* hover magnifier (fine pointers only) */
  const onMove = (e) => {
    if (!canHover.current || e.pointerType !== 'mouse' || !stage.current) return;
    const bx = stage.current.getBoundingClientRect();
    stage.current.style.setProperty('--ox', (((e.clientX - bx.left) / bx.width) * 100).toFixed(1) + '%');
    stage.current.style.setProperty('--oy', (((e.clientY - bx.top) / bx.height) * 100).toFixed(1) + '%');
  };
  const onEnter = (e) => {
    if (canHover.current && e.pointerType === 'mouse') stage.current?.classList.add('is-zoom');
  };
  const onLeave = () => stage.current?.classList.remove('is-zoom');

  const say = (node) => {
    clearTimeout(msgTimer.current);
    setMsg(node);
    msgTimer.current = setTimeout(() => setMsg(null), 5000);
  };

  const onAdd = () => {
    add(product.id, size, qty);
    openDrawer(addBtn.current);
    say(<><Tick /> Added EU {size} · {qty} {qty === 1 ? 'pair' : 'pairs'} to your cart.</>);
  };
  const onBuy = () => {
    add(product.id, size, qty);
    router.push('/checkout');
  };

  const rel = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.cat === product.cat && p.id !== product.id);
    if (list.length < 4) {
      list = list.concat(PRODUCTS.filter((p) =>
        p.cat !== product.cat && p.id !== product.id && Math.abs(p.price - product.price) <= 120));
    }
    return list.slice(0, 4);
  }, [product]);

  const catLabel = CAT_LABEL[product.cat];
  const frame = frames[Math.min(fi, frames.length - 1)];

  return (
    <div className="shop">
      <SiteHeader />

      <main className="container">
        <div className="pagehead pdp__head">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <Chev />
            <Link href={'/shop?cat=' + product.cat}>{catLabel}</Link>
            <Chev />
            <span>{product.name}</span>
          </nav>
        </div>

        <div className="pdp">
          <section className="pdp__media" aria-label="Product images">
            <div className="gal">
              <div className="gal__stage" ref={stage}
                   onPointerMove={onMove} onPointerEnter={onEnter} onPointerLeave={onLeave}>
                <button className="gal__zoom" type="button" ref={zoomBtn} aria-label="Open full-screen image" onClick={openLb}>
                  <img src={frame.src} alt={frame.alt} />
                </button>
              </div>
            </div>
            <div className="gal__thumbs" aria-label="Product image thumbnails" hidden={!multi}>
              {frames.map((f, k) => (
                <button className={'gthumb' + (k === fi && multi ? ' is-on' : '')} type="button" key={f.img}
                        aria-pressed={k === fi && multi} aria-label={'Show ' + f.view.toLowerCase()}
                        onClick={() => showFrame(k)}>
                  <img src={f.src} alt="" loading="lazy" />
                </button>
              ))}
            </div>

            <div className="pdp__acc">
              {[
                {
                  t: 'Description',
                  body: (<ul>
                    <li>{product.name} — {product.sub.toLowerCase()}</li>
                    <li>Breathable engineered upper with a reinforced toe box</li>
                    <li>Responsive foam midsole tuned for {product.cat === 'running' ? 'longer road miles' : 'all-day city wear'}</li>
                    <li>Gum rubber outsole with a pivot circle for quick turns</li>
                    <li>{frames.length} studio {frames.length === 1 ? 'view' : 'views'} above — hover to magnify, click for full screen</li>
                  </ul>)
                },
                {
                  t: 'Shipping & cash on delivery',
                  body: (<ul>
                    <li><b>{SHIPPING[0].label}</b> — {money(SHIPPING[0].cost)} standard delivery, 3–5 working days nationwide</li>
                    <li>You pay the courier in cash on arrival. Nothing is charged online.</li>
                    <li>Free returns within 30 days, unworn and in the original box</li>
                  </ul>)
                }
              ].map((b, i) => (
                <div className="acc__item" key={b.t}>
                  <button className="acc__btn" type="button" aria-expanded={acc[i]} aria-controls={'acc-p-' + i}
                          onClick={() => setAcc((a) => a.map((v, k) => (k === i ? !v : v)))}>
                    {b.t}<Chev size={13} />
                  </button>
                  <div className="acc__panel" id={'acc-p-' + i} hidden={!acc[i]}>{b.body}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="pdp__buy">
            <p className="eyebrow">{catLabel}</p>
            <h1>{product.name}</h1>
            <p className="pdp__sub">{product.sub}</p>

            <div className="pdp__price">
              <b>{money(product.price)}</b>
              <span>{money(SHIPPING[0].cost)} {SHIPPING[0].label} delivery, collected on arrival</span>
            </div>

            <p className={'pdp__stock' + (product.stock ? '' : ' pdp__stock--out')}>
              <span className="dot" />
              {product.stock
                ? 'In stock — dispatched from Tunis within 24 hours'
                : 'Currently unavailable — the rest of the family is in stock below'}
            </p>

            <div className="pdp__field">
              <div className="pdp__fieldhead">
                <span>Select size <em>EU</em></span>
                <button className="linkbtn" type="button" ref={sizeGuide} onClick={() => setSheetOpen(true)}>Size guide</button>
              </div>
              <div className="szgrid" role="group" aria-label="Size">
                {SIZES.map((s) => (
                  <button className={'sz' + (s === size ? ' is-on' : '')} type="button" key={s}
                          disabled={!product.stock} aria-pressed={s === size}
                          onClick={() => setSize(s)}>{s}</button>
                ))}
              </div>
              <p className="pdp__fitnote">{FIT[product.cat]}</p>
            </div>

            <div className="pdp__field">
              <div className="pdp__fieldhead"><span>Quantity</span></div>
              <div className="qty qty--pdp">
                <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span aria-live="polite">{qty}</span>
                <button type="button" aria-label="Increase quantity" disabled={qty >= MAX_QTY} onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}>+</button>
              </div>
            </div>

            <div className="pdp__acts">
              <button className="btn btn--dark btn--block" type="button" ref={addBtn} disabled={!product.stock} onClick={onAdd}>
                {product.stock ? 'Add to cart' : 'Sold out'}
              </button>
              <button className="btn btn--ghost btn--block" type="button" disabled={!product.stock} onClick={onBuy}>
                {product.stock ? 'Buy it now' : 'Choose another size'}
              </button>
            </div>
            <p className="pdp__msg" role="status">{msg}</p>

            <div className="codbox pdp__cod">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5h11v10H2zM13 10h5l3 3v3.5h-8" /><circle cx="6" cy="18.5" r="1.8" /><circle cx="17" cy="18.5" r="1.8" /></svg>
              <span><b>Pay the courier in cash.</b> Nothing is charged online — you hand over the money when the box arrives.</span>
            </div>
          </section>
        </div>

        {lbOpen
          ? <div className="lb" role="dialog" aria-modal="true" aria-label="Full-screen product image"
                 onClick={(e) => { if (e.target.classList.contains('lb')) closeLb(); }}>
              <button className="lb__x" type="button" onClick={closeLb} aria-label="Close full-screen image">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
              <button className="lb__nav lb__nav--prev" type="button" aria-label="Previous image" onClick={() => showFrame(fi - 1)}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 6-6 6 6 6" /></svg>
              </button>
              <figure className="lb__fig"><img src={frame.src} alt={frame.alt} /></figure>
              <button className="lb__nav lb__nav--next" type="button" aria-label="Next image" onClick={() => showFrame(fi + 1)}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m10 6 6 6-6 6" /></svg>
              </button>
            </div>
          : null}

        {sheetOpen
          ? <div className="lb lb--sheet" role="dialog" aria-modal="true" aria-label="Size guide"
                 onClick={(e) => { if (e.target.classList.contains('lb--sheet')) closeSheet(); }}>
              <div className="sheet">
                <div className="sheet__head">
                  <h2>EU size guide</h2>
                  <button className="drawer__x" type="button" onClick={closeSheet} aria-label="Close size guide">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <table className="sztable">
                  <thead><tr><th>EU</th><th>UK</th><th>US</th><th>Foot length</th></tr></thead>
                  <tbody>
                    {SIZES.map((s) => (
                      <tr className={s === size ? 'is-on' : ''} key={s}>
                        <td>{s}</td><td>{s - 35}</td><td>{s - 33}</td>
                        <td>{(22.2 + (s - 36) * 0.665).toFixed(1)} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="hint">Measure from heel to longest toe against a wall. If you land between two rows, take the larger size.</p>
              </div>
            </div>
          : null}

        {rel.length
          ? <section className="pdp__rel">
              <div className="best__head">
                <div>
                  <p className="eyebrow">Complete the look</p>
                  <h2>Others in this family</h2>
                </div>
                <Link className="btn btn--ghost" href="/shop">All styles</Link>
              </div>
              <div className="grid4">
                {rel.map((p) => (
                  <Link className={'rel' + (p.stock ? '' : ' rel--out')} href={productUrl(p.id)} key={p.id}>
                    <div className="prod">
                      <div className="prod__media">
                        {p.badge ? <span className="tag">{p.badge}</span> : null}
                        <img src={'/images/' + p.img + '.png'} alt={p.name} loading="lazy" />
                      </div>
                      <div className="prod__body">
                        <h4>{p.name}</h4>
                        <p className="prod__sub">{p.sub}</p>
                        <div className="prod__row"><span className="prod__price">{money(p.price)}</span></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          : null}

        <div className="cart__foot">
          <Link className="btn btn--ghost" href="/shop">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
            Back to the shop
          </Link>
          <p style={{ fontSize: '12.5px', color: 'var(--muted-2)' }}>Prices include VAT. Free returns within 30 days · dispatched from Tunis within 24 hours.</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
