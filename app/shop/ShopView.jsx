'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { Arrow, BackArrow, Chev, Search, Tick, X } from '@/components/icons';
import { CATS, CAT_LABEL, PRODUCTS, money } from '@/lib/nova';

const FLOOR = 300;
const CEIL = 1000;
const STEP = 50;
const PER_PAGE = 9;

/* ---------- filtering ---------- */
function matches(p, s) {
  if (s.inStock && !p.stock) return false;
  if (p.price < s.min || p.price > s.max) return false;
  if (s.cats.length && s.cats.indexOf(p.cat) === -1) return false;
  if (s.q) {
    const hay = (p.name + ' ' + p.sub + ' ' + CAT_LABEL[p.cat]).toLowerCase();
    if (hay.indexOf(s.q.toLowerCase().trim()) === -1) return false;
  }
  return true;
}
function results(s) { return PRODUCTS.filter((p) => matches(p, s)); }

const DEFAULTS = { q: '', cats: [], min: FLOOR, max: CEIL, inStock: false, page: 1 };
function isDefault(s) {
  return !s.q && !s.cats.length && !s.inStock && s.min === FLOOR && s.max === CEIL;
}

/* ---------- url ---------- */
function readUrl(sp) {
  const cats = (sp.get('cat') || '').split(',').filter((c) => CAT_LABEL[c]);
  const mn = +sp.get('min');
  const mx = +sp.get('max');
  let min = mn >= FLOOR && mn <= CEIL ? mn : FLOOR;
  let max = mx >= FLOOR && mx <= CEIL ? mx : CEIL;
  if (min > max - STEP) { min = FLOOR; max = CEIL; }
  return {
    q: sp.get('q') || '',
    cats,
    min,
    max,
    inStock: sp.get('stock') === '1',
    page: Math.max(1, +sp.get('page') || 1)
  };
}
function writeQuery(s) {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q);
  if (s.cats.length) p.set('cat', s.cats.join(','));
  if (s.min !== FLOOR) p.set('min', s.min);
  if (s.max !== CEIL) p.set('max', s.max);
  if (s.inStock) p.set('stock', '1');
  if (s.page > 1) p.set('page', s.page);
  return p.toString();
}

/* ---------- pagination ---------- */
function pageList(current, total) {
  if (total <= 7) {
    const all = [];
    for (let a = 1; a <= total; a++) all.push(a);
    return all;
  }
  const out = [1];
  if (current > 3) out.push('…');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
  if (current < total - 2) out.push('…');
  out.push(total);
  return out;
}

export default function ShopView({ query }) {
  const initial = new URLSearchParams(query || '');

  const [state, setState] = useState(() => readUrl(initial));
  const [qText, setQText] = useState(state.q);
  const written = useRef(initial.toString());
  const typing = useRef(null);

  /* a link from the header, the back button or a hand-typed URL replaces the filters */
  useEffect(() => {
    const cur = new URLSearchParams(query || '').toString();
    if (cur !== written.current) {
      const next = readUrl(new URLSearchParams(cur));
      written.current = cur;
      setState(next);
      setQText(next.q);
    }
  }, [query]);

  useEffect(() => {
    const qs = writeQuery(state);
    if (qs !== written.current) {
      written.current = qs;
      window.history.replaceState(null, '', qs ? '/shop?' + qs : '/shop');
    }
  }, [state]);

  useEffect(() => setQText(state.q), [state.q]);

  const patch = (changes) => setState((s) => ({ ...s, ...changes }));

  const items = useMemo(() => results(state), [state]);
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const page = Math.min(state.page, pages);
  const slice = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const from = items.length ? (page - 1) * PER_PAGE + 1 : 0;
  const to = Math.min(items.length, page * PER_PAGE);
  const pagerHidden = items.length === 0 || pages < 2;

  const onSearch = (e) => {
    const v = e.target.value;
    setQText(v);
    clearTimeout(typing.current);
    typing.current = setTimeout(() => patch({ q: v, page: 1 }), 140);
  };

  const onCat = (id, checked) => {
    setState((s) => {
      const cats = checked ? [...new Set([...s.cats, id])] : s.cats.filter((c) => c !== id);
      return { ...s, cats, page: 1 };
    });
  };

  const onRange = (which, v) => {
    setState((s) => {
      const next = { ...s, page: 1 };
      if (which === 'min') next.min = Math.min(v, s.max - STEP);
      else next.max = Math.max(v, s.min + STEP);
      return next;
    });
  };

  const dropChip = (kind) => {
    setState((s) => {
      if (kind === 'q') return { ...s, q: '', page: 1 };
      if (kind === 'price') return { ...s, min: FLOOR, max: CEIL, page: 1 };
      if (kind === 'stock') return { ...s, inStock: false, page: 1 };
      if (kind.indexOf('cat:') === 0) {
        const cats = s.cats.filter((c) => c !== kind.slice(4));
        if (cats.length === s.cats.length) return s;
        return { ...s, cats, page: 1 };
      }
      return s;
    });
  };

  const clearAll = () => { setState({ ...DEFAULTS }); setQText(''); };

  const goPage = (n) => {
    patch({ page: n });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pct = (v) => ((v - FLOOR) / (CEIL - FLOOR)) * 100;
  const inStockCount = PRODUCTS.filter((p) => p.stock).length;
  const chips = [];
  if (state.q) chips.push({ k: 'q', t: 'Search', v: state.q });
  state.cats.forEach((c) => chips.push({ k: 'cat:' + c, t: 'Category', v: CAT_LABEL[c] }));
  if (state.min !== FLOOR || state.max !== CEIL) {
    chips.push({ k: 'price', t: 'Price', v: money(state.min, 0) + ' – ' + money(state.max, 0) });
  }
  if (state.inStock) chips.push({ k: 'stock', t: '', v: 'In stock only' });

  return (
    <main className="container">
        <div className="shop__head">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <Chev />
            <span>Shop</span>
          </nav>
          <h1>Shop All Sneakers</h1>
          <p className="shop__lede">Every NOVA silhouette in one place — filter by category, price and availability.</p>
        </div>

        <div className="shop__layout">
          <aside className="filters" aria-label="Product filters">
            <div className="filters__top">
              <h2 className="filters__title">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                Filters
              </h2>
              <button type="button" className="filters__clear" hidden={isDefault(state)} onClick={clearAll}>Clear all</button>
            </div>

            <section className="fgroup">
              <h3 className="fgroup__label">Search</h3>
              <div className="search">
                <Search size={16} width={1.9} />
                <input type="search" value={qText} placeholder="Search sneakers…" autoComplete="off"
                       aria-label="Search sneakers" onChange={onSearch} />
                <button type="button" className="search__clear" aria-label="Clear search" hidden={!state.q}
                        onClick={() => { patch({ q: '', page: 1 }); }}>
                  <X size={14} />
                </button>
              </div>
            </section>

            <section className="fgroup">
              <h3 className="fgroup__label">Categories</h3>
              <div className="fgroup__list">
                {CATS.map((c) => {
                  const base = { q: state.q, min: state.min, max: state.max, inStock: state.inStock, cats: [c.id] };
                  return (
                    <label className="check" key={c.id}>
                      <input type="checkbox" value={c.id} checked={state.cats.indexOf(c.id) > -1}
                             onChange={(e) => onCat(c.id, e.target.checked)} />
                      <span className="check__box"><Tick /></span>
                      <span>{c.label}</span>
                      <span className="fgroup__count">{results(base).length}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="fgroup">
              <h3 className="fgroup__label">Price Range</h3>
              <div className="price">
                <span>{money(state.min, 0)}</span>
                <span>{money(state.max, 0)}</span>
              </div>
              <div className="range">
                <div className="range__track" />
                <div className="range__fill" style={{ left: pct(state.min) + '%', right: (100 - pct(state.max)) + '%' }} />
                <input type="range" min={FLOOR} max={CEIL} step={STEP} value={state.min}
                       aria-label="Minimum price"
                       onChange={(e) => onRange('min', +e.target.value)} />
                <input type="range" min={FLOOR} max={CEIL} step={STEP} value={state.max}
                       aria-label="Maximum price"
                       onChange={(e) => onRange('max', +e.target.value)} />
              </div>
              <div className="range__ends"><span>TND 300</span><span>TND 1,000</span></div>
            </section>

            <section className="fgroup">
              <h3 className="fgroup__label">Availability</h3>
              <label className="switch">
                <input type="checkbox" checked={state.inStock}
                       onChange={(e) => patch({ inStock: e.target.checked, page: 1 })} />
                <span className="switch__ui"><span className="switch__knob" /></span>
                <span className="switch__text">In stock only</span>
                <span className="fgroup__count">{inStockCount} of {PRODUCTS.length}</span>
              </label>
            </section>
          </aside>

          <section className="results">
            <div className="results__bar">
              <p className="results__count" aria-live="polite">
                {items.length
                  ? <>Showing <strong>{from}–{to}</strong> of <strong>{items.length}</strong> {items.length === 1 ? 'style' : 'styles'}</>
                  : 'No styles found'}
              </p>
              <div className="results__chips">
                {chips.map((c) => (
                  <button className="chip" type="button" key={c.k} onClick={() => dropChip(c.k)}>
                    <span>{c.t ? <><b>{c.t}:</b> </> : null}{c.v}</span>
                    <X size={12} width={2.2} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid" hidden={items.length === 0}>
              {slice.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>

            {items.length === 0
              ? <div className="empty">
                  <Search size={34} width={1.5} />
                  <h3>No sneakers match those filters</h3>
                  <p>Try a different search term, widen the price range, or clear the filters.</p>
                  <button type="button" className="btn btn--dark" onClick={clearAll}>Clear all filters</button>
                </div>
              : null}

            <nav className="pager" aria-label="Pagination" hidden={pagerHidden}>
              {!pagerHidden && <>
                  <button className="pager__btn" type="button" disabled={page === 1} aria-label="Previous page"
                          onClick={() => goPage(page - 1)}>
                    <BackArrow size={13} /><span>Prev</span>
                  </button>
                  {pageList(page, pages).map((n, i) => n === '…'
                    ? <span className="pager__gap" key={'g' + i}>…</span>
                    : <button className="pager__btn" type="button" key={n} aria-current={n === page ? 'page' : undefined}
                              onClick={() => goPage(n)}>{n}</button>)}
                  <button className="pager__btn" type="button" disabled={page === pages} aria-label="Next page"
                          onClick={() => goPage(page + 1)}>
                    <span>Next</span><Arrow size={13} />
                  </button>
                  <p className="pager__info">Page {page} of {pages} — showing {from}–{to} of {items.length}</p>
              </>}
            </nav>
          </section>
        </div>
      </main>
  );
}
