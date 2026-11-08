'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { Arrow, BackArrow, Chev, Search, Tick, X } from '@/components/icons';
import { getAllProducts, getCategories, formatPrice, cleanCategoryHandle } from '@/lib/medusa';
import { mapProducts } from '@/lib/product-view';

const PER_PAGE = 9;

function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function matches(p, s, catMap = {}) {
  if (s.inStock && !p.stock) return false;
  if (p.price < s.min || p.price > s.max) return false;
  if (s.cats.length && !s.cats.includes(p.cat)) return false;
  if (s.q) {
    const qNorm = norm(s.q.trim());
    const catName = catMap[p.cat] || '';
    const hay = norm(`${p.name} ${p.sub} ${catName} ${p.raw?.description || ''}`);
    if (!hay.includes(qNorm)) return false;
  }
  return true;
}

/* Pagination numbers with ellipsis */
function pageList(current, total) {
  if (total <= 7) {
    const all = [];
    for (let a = 1; a <= total; a++) all.push(a);
    return all;
  }
  const out = [1];
  if (current > 3) out.push('…');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    out.push(i);
  }
  if (current < total - 2) out.push('…');
  out.push(total);
  return out;
}

export default function ShopView({
  query = '',
  fixedCategory = null,
  initialProducts = [],
  initialCategories = [],
}) {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);

  // Client-side fallback if server-rendered list was empty
  useEffect(() => {
    if (!products.length) {
      getAllProducts().then((raw) => setProducts(mapProducts(raw))).catch(() => {});
    }
    if (!categories.length) {
      getCategories().then((cats) => setCategories(cats || [])).catch(() => {});
    }
  }, [products.length, categories.length]);

  const catMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[cleanCategoryHandle(c.handle)] = c.name;
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // Compute price bounds from loaded products
  const { FLOOR, CEIL, STEP, currencyCode } = useMemo(() => {
    const prices = products.map((p) => p.price).filter((p) => typeof p === 'number' && !isNaN(p));
    const curr = products[0]?.currencyCode || '';
    if (!prices.length) return { FLOOR: 0, CEIL: 1000, STEP: 25, currencyCode: curr };
    const minP = Math.floor(Math.min(...prices));
    const maxP = Math.ceil(Math.max(...prices));
    const fl = Math.max(0, Math.floor(minP / 10) * 10);
    const cl = Math.max(fl + 10, Math.ceil(maxP / 10) * 10);
    const step = Math.max(1, Math.round((cl - fl) / 20));
    return { FLOOR: fl, CEIL: cl, STEP: step, currencyCode: curr };
  }, [products]);

  // Read URL params into filter state
  const readUrl = (sp) => {
    let cats = (sp.get('cat') || '')
      .split(',')
      .map((c) => cleanCategoryHandle(c.trim()))
      .filter((c) => c && (catMap[c] || fixedCategory === c));

    if (fixedCategory && !cats.includes(fixedCategory)) {
      cats = [fixedCategory];
    }

    const mn = sp.has('min') ? +sp.get('min') : NaN;
    const mx = sp.has('max') ? +sp.get('max') : NaN;
    let min = !isNaN(mn) && mn >= FLOOR && mn <= CEIL ? mn : FLOOR;
    let max = !isNaN(mx) && mx >= FLOOR && mx <= CEIL ? mx : CEIL;
    if (min > max - STEP) {
      min = FLOOR;
      max = CEIL;
    }

    const rawPage = +sp.get('page');
    const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

    return {
      q: sp.get('q') || '',
      cats,
      min,
      max,
      inStock: sp.get('stock') === '1',
      page,
    };
  };

  const initial = useMemo(() => new URLSearchParams(query || ''), [query]);
  const [state, setState] = useState(() => readUrl(initial));
  const [qText, setQText] = useState(state.q);
  const written = useRef(initial.toString());
  const typing = useRef(null);

  // Update state when query prop changes (e.g. from nav or popstate)
  useEffect(() => {
    const cur = new URLSearchParams(query || '').toString();
    if (cur !== written.current) {
      const next = readUrl(new URLSearchParams(cur));
      written.current = cur;
      setState(next);
      setQText(next.q);
    }
  }, [query, FLOOR, CEIL]);

  // Write query to browser history without causing Next.js router refetch
  const writeQuery = (s) => {
    const p = new URLSearchParams();
    if (s.q) p.set('q', s.q);
    if (s.cats.length && (!fixedCategory || s.cats.join(',') !== fixedCategory)) {
      p.set('cat', s.cats.join(','));
    }
    if (s.min !== FLOOR) p.set('min', String(s.min));
    if (s.max !== CEIL) p.set('max', String(s.max));
    if (s.inStock) p.set('stock', '1');
    if (s.page > 1) p.set('page', String(s.page));
    return p.toString();
  };

  const basePath = fixedCategory ? `/c/${fixedCategory}` : '/shop';

  useEffect(() => {
    const qs = writeQuery(state);
    if (qs !== written.current) {
      written.current = qs;
      window.history.replaceState(null, '', qs ? `${basePath}?${qs}` : basePath);
    }
  }, [state, basePath, FLOOR, CEIL]);

  useEffect(() => setQText(state.q), [state.q]);

  const patch = (changes) => setState((s) => ({ ...s, ...changes }));

  // Filtered products list
  const filtered = useMemo(() => {
    return products.filter((p) => matches(p, state, catMap));
  }, [products, state, catMap]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(Math.max(1, state.page), pages);
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const from = filtered.length ? (page - 1) * PER_PAGE + 1 : 0;
  const to = Math.min(filtered.length, page * PER_PAGE);
  const pagerHidden = filtered.length === 0 || pages < 2;

  const onSearch = (e) => {
    const v = e.target.value;
    setQText(v);
    clearTimeout(typing.current);
    typing.current = setTimeout(() => patch({ q: v, page: 1 }), 140);
  };

  const onCat = (handle, checked) => {
    if (fixedCategory) return;
    setState((s) => {
      const cats = checked
        ? [...new Set([...s.cats, handle])]
        : s.cats.filter((c) => c !== handle);
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
        if (fixedCategory) return s;
        const target = kind.slice(4);
        const cats = s.cats.filter((c) => c !== target);
        return { ...s, cats, page: 1 };
      }
      return s;
    });
  };

  const isDefault =
    !state.q &&
    (fixedCategory ? state.cats.length === 1 && state.cats[0] === fixedCategory : !state.cats.length) &&
    !state.inStock &&
    state.min === FLOOR &&
    state.max === CEIL;

  const clearAll = () => {
    setState({
      q: '',
      cats: fixedCategory ? [fixedCategory] : [],
      min: FLOOR,
      max: CEIL,
      inStock: false,
      page: 1,
    });
    setQText('');
  };

  const goPage = (n) => {
    patch({ page: n });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pct = (v) => {
    if (CEIL === FLOOR) return 0;
    return Math.max(0, Math.min(100, ((v - FLOOR) / (CEIL - FLOOR)) * 100));
  };

  const inStockCount = products.filter((p) => p.stock).length;

  const chips = [];
  if (state.q) chips.push({ k: 'q', t: 'Search', v: state.q });
  if (!fixedCategory) {
    state.cats.forEach((c) =>
      chips.push({ k: 'cat:' + c, t: 'Category', v: catMap[c] || c })
    );
  }
  if (state.min !== FLOOR || state.max !== CEIL) {
    chips.push({
      k: 'price',
      t: 'Price',
      v: `${formatPrice(state.min, currencyCode, 0)} – ${formatPrice(state.max, currencyCode, 0)}`,
    });
  }
  if (state.inStock) chips.push({ k: 'stock', t: '', v: 'In stock only' });

  const activeCategoryTitle = fixedCategory
    ? catMap[fixedCategory] || fixedCategory.charAt(0).toUpperCase() + fixedCategory.slice(1)
    : 'Shop All Sneakers';

  return (
    <main className="container">
      <div className="shop__head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <Chev />
          {fixedCategory ? (
            <>
              <Link href="/shop">Shop</Link>
              <Chev />
              <span>{activeCategoryTitle}</span>
            </>
          ) : (
            <span>Shop</span>
          )}
        </nav>
        <h1>{activeCategoryTitle}</h1>
        <p className="shop__lede">
          {fixedCategory
            ? `Explore all ${activeCategoryTitle} — filter by price and availability.`
            : 'Explore our complete footwear collection — filter by category, price and availability.'}
        </p>
      </div>

      <div className="shop__layout">
        <aside className="filters" aria-label="Product filters">
          <div className="filters__top">
            <h2 className="filters__title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Filters
            </h2>
            <button type="button" className="filters__clear" hidden={isDefault} onClick={clearAll}>
              Clear all
            </button>
          </div>

          <section className="fgroup">
            <h3 className="fgroup__label">Search</h3>
            <div className="search">
              <Search size={16} width={1.9} />
              <input
                type="search"
                value={qText}
                placeholder="Search sneakers…"
                autoComplete="off"
                aria-label="Search sneakers"
                onChange={onSearch}
              />
              <button
                type="button"
                className="search__clear"
                aria-label="Clear search"
                hidden={!state.q}
                onClick={() => patch({ q: '', page: 1 })}
              >
                <X size={14} />
              </button>
            </div>
          </section>

          {!fixedCategory && (
            <section className="fgroup">
              <h3 className="fgroup__label">Categories</h3>
              <div className="fgroup__list">
                {categories.map((c) => {
                  const handle = cleanCategoryHandle(c.handle);
                  const isChecked = state.cats.includes(handle);
                  const countForCat = products.filter((p) => p.cat === handle).length;

                  return (
                    <label className="check" key={c.id || handle}>
                      <input
                        type="checkbox"
                        value={handle}
                        checked={isChecked}
                        onChange={(e) => onCat(handle, e.target.checked)}
                      />
                      <span className="check__box"><Tick /></span>
                      <span>{c.name}</span>
                      <span className="fgroup__count">{countForCat}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          <section className="fgroup">
            <h3 className="fgroup__label">Price Range</h3>
            <div className="price">
              <span>{formatPrice(state.min, currencyCode, 0)}</span>
              <span>{formatPrice(state.max, currencyCode, 0)}</span>
            </div>
            <div className="range">
              <div className="range__track" />
              <div
                className="range__fill"
                style={{
                  left: pct(state.min) + '%',
                  right: (100 - pct(state.max)) + '%',
                }}
              />
              <input
                type="range"
                min={FLOOR}
                max={CEIL}
                step={STEP}
                value={state.min}
                aria-label="Minimum price"
                onChange={(e) => onRange('min', +e.target.value)}
              />
              <input
                type="range"
                min={FLOOR}
                max={CEIL}
                step={STEP}
                value={state.max}
                aria-label="Maximum price"
                onChange={(e) => onRange('max', +e.target.value)}
              />
            </div>
            <div className="range__ends">
              <span>{formatPrice(FLOOR, currencyCode, 0)}</span>
              <span>{formatPrice(CEIL, currencyCode, 0)}</span>
            </div>
          </section>

          <section className="fgroup">
            <h3 className="fgroup__label">Availability</h3>
            <label className="switch">
              <input
                type="checkbox"
                checked={state.inStock}
                onChange={(e) => patch({ inStock: e.target.checked, page: 1 })}
              />
              <span className="switch__ui"><span className="switch__knob" /></span>
              <span className="switch__text">In stock only</span>
              <span className="fgroup__count">{inStockCount} of {products.length}</span>
            </label>
          </section>
        </aside>

        <section className="results">
          <div className="results__bar">
            <p className="results__count" aria-live="polite">
              {filtered.length ? (
                <>Showing <strong>{from}–{to}</strong> of <strong>{filtered.length}</strong> {filtered.length === 1 ? 'style' : 'styles'}</>
              ) : (
                'No styles found'
              )}
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

          <div className="grid" hidden={filtered.length === 0}>
            {slice.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>

          {filtered.length === 0 && (
            <div className="empty">
              <Search size={34} width={1.5} />
              <h3>No sneakers match those filters</h3>
              <p>Try a different search term, widen the price range, or clear the filters.</p>
              <button type="button" className="btn btn--dark" onClick={clearAll}>Clear all filters</button>
            </div>
          )}

          <nav className="pager" aria-label="Pagination" hidden={pagerHidden}>
            {!pagerHidden && (
              <>
                <button
                  className="pager__btn"
                  type="button"
                  disabled={page === 1}
                  aria-label="Previous page"
                  onClick={() => goPage(page - 1)}
                >
                  <BackArrow size={13} /><span>Prev</span>
                </button>
                {pageList(page, pages).map((n, i) =>
                  n === '…' ? (
                    <span className="pager__gap" key={'g' + i}>…</span>
                  ) : (
                    <button
                      className="pager__btn"
                      type="button"
                      key={n}
                      aria-current={n === page ? 'page' : undefined}
                      onClick={() => goPage(n)}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  className="pager__btn"
                  type="button"
                  disabled={page === pages}
                  aria-label="Next page"
                  onClick={() => goPage(page + 1)}
                >
                  <span>Next</span><Arrow size={13} />
                </button>
                <p className="pager__info">
                  Page {page} of {pages} — showing {from}–{to} of {filtered.length}
                </p>
              </>
            )}
          </nav>
        </section>
      </div>
    </main>
  );
}
