'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chev } from '@/components/icons';
import { MAX_QTY, useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/medusa';
import { productUrl } from '@/lib/nova';

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

export default function ProductView({ product, rawProduct, related = [], searchParams = {} }) {
  const router = useRouter();
  const { add, openDrawer } = useCart();

  const images = product.images.length > 0 ? product.images : (product.img ? [product.img] : ['/images/hero-shoe.png']);
  const multi = images.length > 1;

  const [fi, setFi] = useState(0);
  const [qty, setQty] = useState(1);
  const [lbOpen, setLbOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [acc, setAcc] = useState([true, false]);
  const [msg, setMsg] = useState(null);
  const [isErrMsg, setIsErrMsg] = useState(false);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const stage = useRef(null);
  const zoomBtn = useRef(null);
  const addBtn = useRef(null);
  const sizeGuide = useRef(null);
  const lbReturn = useRef(null);
  const canHover = useRef(false);
  const msgTimer = useRef(null);

  // Real options excluding "Default Option"
  const options = useMemo(() => {
    return (rawProduct?.options || []).filter((opt) => opt.title !== 'Default Option');
  }, [rawProduct]);

  const variants = useMemo(() => rawProduct?.variants || [], [rawProduct]);

  // Initial option selection: pick first variant with stock > 0, or first variant
  const initialSelection = useMemo(() => {
    const sel = {};
    if (!options.length) return sel;

    const inStockVar = variants.find((v) => (v.inventory_quantity ?? 0) > 0) || variants[0];
    if (inStockVar && inStockVar.options) {
      options.forEach((opt) => {
        const found = inStockVar.options.find(
          (vo) => vo.option_id === opt.id || vo.option?.title === opt.title
        );
        if (found) sel[opt.id] = found.value;
      });
    }

    // Ensure all options have a value
    options.forEach((opt) => {
      if (!sel[opt.id] && opt.values?.length) {
        sel[opt.id] = opt.values[0].value;
      }
    });

    return sel;
  }, [options, variants]);

  const [selectedOptions, setSelectedOptions] = useState(initialSelection);

  // Active chosen variant based on selectedOptions
  const chosenVariant = useMemo(() => {
    if (!variants.length) return null;
    if (!options.length) return variants[0];

    return variants.find((v) => {
      return options.every((opt) => {
        const wanted = selectedOptions[opt.id];
        return v.options?.some(
          (vo) => (vo.option_id === opt.id || vo.option?.title === opt.title) && vo.value === wanted
        );
      });
    }) || variants[0];
  }, [variants, options, selectedOptions]);

  const priceAmount =
    chosenVariant?.calculated_price?.calculated_amount ?? product.price;
  const currencyCode =
    chosenVariant?.calculated_price?.currency_code || product.currencyCode || 'TND';

  const sizeOption = options.find((o) => o.title.toLowerCase() === 'size');
  const selectedSizeVal = sizeOption ? selectedOptions[sizeOption.id] : null;

  const stockQty = chosenVariant?.inventory_quantity ?? 0;
  const isVariantInStock = stockQty > 0;
  const isProductSoldOut = !product.stock;

  useEffect(() => {
    canHover.current = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  }, []);

  const showFrame = useCallback((i) => {
    if (!multi) { setFi(0); return; }
    setFi(((i % images.length) + images.length) % images.length);
  }, [multi, images]);

  /* lightbox + size sheet body scroll lock */
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

  const say = (node, isErr = false) => {
    clearTimeout(msgTimer.current);
    setMsg(node);
    setIsErrMsg(isErr);
    msgTimer.current = setTimeout(() => {
      setMsg(null);
      setIsErrMsg(false);
    }, 5000);
  };

  const onAdd = async () => {
    if (!chosenVariant || !isVariantInStock || adding || buying) return;
    const trigger = addBtn.current;
    setAdding(true);
    try {
      await add(product.id, chosenVariant.id, qty, {
        variantTitle: chosenVariant.title !== 'Default' ? chosenVariant.title : '',
        price: priceAmount,
        name: product.name,
        img: product.img,
      });
      openDrawer(trigger);
      say(
        <>
          <Tick /> Added {product.name}
          {chosenVariant.title && chosenVariant.title !== 'Default'
            ? ` (${chosenVariant.title})`
            : ''}{' '}
          · {qty} {qty === 1 ? 'pair' : 'pairs'} to your cart.
        </>
      );
    } catch (err) {
      console.error('[pdp] Add to cart error:', err);
      const errorMsg =
        err?.data?.message || err?.message || 'Could not add to cart. Please try again.';
      say(errorMsg, true);
    } finally {
      setAdding(false);
    }
  };

  const onBuy = async () => {
    if (!chosenVariant || !isVariantInStock || adding || buying) return;
    setBuying(true);
    try {
      await add(product.id, chosenVariant.id, qty, {
        variantTitle: chosenVariant.title !== 'Default' ? chosenVariant.title : '',
        price: priceAmount,
        name: product.name,
        img: product.img,
      });
      router.push('/checkout');
    } catch (err) {
      console.error('[pdp] Buy it now error:', err);
      const errorMsg =
        err?.data?.message || err?.message || 'Could not proceed to checkout. Please try again.';
      say(errorMsg, true);
    } finally {
      setBuying(false);
    }
  };

  const currentFrameSrc = images[Math.min(fi, images.length - 1)];
  const catTitle = product.category?.name || product.cat || '';

  return (
    <main className="container">
      <div className="pagehead pdp__head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <Chev />
          {product.cat && (
            <>
              <Link href={'/c/' + product.cat}>{catTitle || product.cat}</Link>
              <Chev />
            </>
          )}
          <span>{product.name}</span>
        </nav>
      </div>

      <div className="pdp">
        <section className="pdp__media" aria-label="Product images">
          <div className="gal">
            <div className="gal__stage" ref={stage}
                 onPointerMove={onMove} onPointerEnter={onEnter} onPointerLeave={onLeave}>
              <button className="gal__zoom" type="button" ref={zoomBtn} aria-label="Open full-screen image" onClick={openLb}>
                {product.badge && <span className="tag" style={{ position: 'absolute', top: 16, left: 16, zIndex: 3 }}>{product.badge}</span>}
                <img src={currentFrameSrc} alt={product.name} />
              </button>
            </div>
          </div>
          <div className="gal__thumbs" aria-label="Product image thumbnails" hidden={!multi}>
            {images.map((src, k) => (
              <button className={'gthumb' + (k === fi && multi ? ' is-on' : '')} type="button" key={k}
                      aria-pressed={k === fi && multi} aria-label={'Show image ' + (k + 1)}
                      onClick={() => showFrame(k)}>
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>

          <div className="pdp__acc">
            {[
              {
                t: 'Description',
                body: (
                  <p style={{ lineHeight: 1.6, color: '#444' }}>
                    {product.raw?.description || product.sub || product.name}
                  </p>
                )
              },
              {
                t: 'Shipping & cash on delivery',
                body: (
                  <ul>
                    <li><b>Cash on delivery</b> — pay the courier in cash on arrival. Nothing is charged online.</li>
                    <li>Delivery options and rates are calculated at checkout.</li>
                    <li>Inspect your parcel on delivery.</li>
                  </ul>
                )
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
          {catTitle && <p className="eyebrow">{catTitle}</p>}
          <h1>{product.name}</h1>
          {product.sub && <p className="pdp__sub">{product.sub}</p>}

          <div className="pdp__price">
            <b>{formatPrice(priceAmount, currencyCode)}</b>
            <span>Cash on delivery across Tunisia</span>
          </div>

          <p className={'pdp__stock' + (isVariantInStock ? '' : ' pdp__stock--out')}>
            <span className="dot" />
            {isVariantInStock
              ? (stockQty <= 5 ? `Only ${stockQty} left in stock` : 'In stock — ready for dispatch')
              : 'Sold out'}
          </p>

          {/* Option pickers: one row per option, hidden when product has single variant */}
          {options.length > 0 && variants.length > 1 && options.map((opt) => {
            const isSize = opt.title.toLowerCase() === 'size';
            return (
              <div className="pdp__field" key={opt.id}>
                <div className="pdp__fieldhead">
                  <span>
                    Select {opt.title.toLowerCase()} {isSize && <em>EU</em>}
                  </span>
                  {isSize && (
                    <button className="linkbtn" type="button" ref={sizeGuide} onClick={() => setSheetOpen(true)}>
                      Size guide
                    </button>
                  )}
                </div>
                <div className="szgrid" role="group" aria-label={opt.title}>
                  {(opt.values || []).map((val) => {
                    const isSelected = selectedOptions[opt.id] === val.value;

                    // Check if there is any variant matching this option choice with inventory > 0
                    const isPurchasable = variants.some((v) => {
                      const matchesThis = v.options?.some(
                        (vo) => (vo.option_id === opt.id || vo.option?.title === opt.title) && vo.value === val.value
                      );
                      const matchesOtherSelected = options.every((other) => {
                        if (other.id === opt.id) return true;
                        const otherVal = selectedOptions[other.id];
                        return v.options?.some(
                          (vo) => (vo.option_id === other.id || vo.option?.title === other.title) && vo.value === otherVal
                        );
                      });
                      return matchesThis && matchesOtherSelected && (v.inventory_quantity ?? 0) > 0;
                    });

                    return (
                      <button
                        className={'sz' + (isSelected ? ' is-on' : '')}
                        type="button"
                        key={val.id || val.value}
                        disabled={!isPurchasable}
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedOptions((prev) => ({
                            ...prev,
                            [opt.id]: val.value,
                          }));
                        }}
                      >
                        {val.value}
                      </button>
                    );
                  })}
                </div>
                {isSize && FIT[product.cat] && <p className="pdp__fitnote">{FIT[product.cat]}</p>}
              </div>
            );
          })}

          <div className="pdp__field">
            <div className="pdp__fieldhead"><span>Quantity</span></div>
            <div className="qty qty--pdp">
              <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span aria-live="polite">{qty}</span>
              <button type="button" aria-label="Increase quantity" disabled={qty >= MAX_QTY || (stockQty > 0 && qty >= stockQty)} onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}>+</button>
            </div>
          </div>

          <div className="pdp__acts">
            <button
              className="btn btn--dark btn--block"
              type="button"
              ref={addBtn}
              disabled={!isVariantInStock || adding || buying}
              onClick={onAdd}
            >
              {!isVariantInStock
                ? 'Sold out'
                : adding
                ? 'Adding…'
                : 'Add to cart'}
            </button>
            <button
              className="btn btn--ghost btn--block"
              type="button"
              disabled={!isVariantInStock || adding || buying}
              onClick={onBuy}
            >
              {!isVariantInStock
                ? 'Sold out'
                : buying
                ? 'Proceeding…'
                : 'Buy it now'}
            </button>
          </div>
          <p className={'pdp__msg' + (isErrMsg ? ' pdp__msg--err' : '')} role="status">{msg}</p>

          <div className="codbox pdp__cod">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5h11v10H2zM13 10h5l3 3v3.5h-8" /><circle cx="6" cy="18.5" r="1.8" /><circle cx="17" cy="18.5" r="1.8" /></svg>
            <span><b>Pay the courier in cash.</b> Nothing is charged online — you hand over the money when the box arrives.</span>
          </div>
        </section>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="pdp__rel">
          <div className="best__head">
            <div>
              <p className="eyebrow">Complete the look</p>
              <h2>Others in this family</h2>
            </div>
            <Link className="btn btn--ghost" href="/shop">All styles</Link>
          </div>
          <div className="grid4">
            {related.map((p) => (
              <Link className={'rel' + (p.stock ? '' : ' rel--out')} href={productUrl(p.handle || p.id)} key={p.id}>
                <div className="prod">
                  <div className="prod__media">
                    {p.badge && <span className="tag">{p.badge}</span>}
                    <img src={p.img || '/images/hero-shoe.png'} alt={p.name} loading="lazy" />
                  </div>
                  <div className="prod__body">
                    <h4>{p.name}</h4>
                    {p.sub && <p className="prod__sub">{p.sub}</p>}
                    <div className="prod__row"><span className="prod__price">{p.from ? 'From ' : ''}{formatPrice(p.price, p.currencyCode)}</span></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lbOpen && (
        <div
          className="lb"
          role="dialog"
          aria-modal="true"
          aria-label="Full-screen product image"
          onClick={(e) => {
            if (e.target.classList.contains('lb')) closeLb();
          }}
        >
          <button className="lb__x" type="button" onClick={closeLb} aria-label="Close full-screen image">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <button className="lb__nav lb__nav--prev" type="button" aria-label="Previous image" onClick={() => showFrame(fi - 1)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m14 6-6 6 6 6" />
            </svg>
          </button>
          <figure className="lb__fig">
            <img src={currentFrameSrc} alt={product.name} />
          </figure>
          <button className="lb__nav lb__nav--next" type="button" aria-label="Next image" onClick={() => showFrame(fi + 1)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m10 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Size sheet */}
      {sheetOpen && (
        <div
          className="lb lb--sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Size guide"
          onClick={(e) => {
            if (e.target.classList.contains('lb--sheet')) closeSheet();
          }}
        >
          <div className="sheet">
            <div className="sheet__head">
              <h2>EU size guide</h2>
              <button className="drawer__x" type="button" onClick={closeSheet} aria-label="Close size guide">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <table className="sztable">
              <thead>
                <tr>
                  <th>EU</th>
                  <th>UK</th>
                  <th>US</th>
                  <th>Foot length</th>
                </tr>
              </thead>
              <tbody>
                {[36, 37, 38, 39, 40, 41, 42, 43, 44, 45].map((s) => (
                  <tr className={String(s) === selectedSizeVal ? 'is-on' : ''} key={s}>
                    <td>{s}</td>
                    <td>{s - 35}</td>
                    <td>{s - 33}</td>
                    <td>{(22.2 + (s - 36) * 0.665).toFixed(1)} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hint">Measure from heel to longest toe against a wall. If you land between two rows, take the larger size.</p>
          </div>
        </div>
      )}
    </main>
  );
}
