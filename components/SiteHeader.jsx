'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CATS } from '@/lib/nova';
import { useCart } from '@/lib/cart';
import { Bag, ChevDown, Menu, Search, User } from './icons';

const catHref = (id) => '/shop?cat=' + encodeURIComponent(id);

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, count, openDrawer } = useCart();

  const [query, setQuery] = useState('');
  const [catsOpen, setCatsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const catsRef = useRef(null);
  const catsButtonRef = useRef(null);
  const cartButtonRef = useRef(null);

  const isCartPage = pathname === '/cart' || pathname.startsWith('/checkout');

  function submitSearch(e) {
    e.preventDefault();
    const trimmed = query.trim();
    setCatsOpen(false);
    setMobileOpen(false);
    router.push(trimmed ? '/shop?q=' + encodeURIComponent(trimmed) : '/shop');
  }

  useEffect(() => {
    setCatsOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!catsOpen) return;
    function onPointerDown(e) {
      if (!catsRef.current || !catsRef.current.contains(e.target)) setCatsOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [catsOpen]);

  useEffect(() => {
    if (!catsOpen && !mobileOpen) return;
    function onKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (catsOpen) {
        setCatsOpen(false);
        if (catsButtonRef.current) catsButtonRef.current.focus();
      }
      setMobileOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [catsOpen, mobileOpen]);

  const searchField = (id) => (
    <form className="nav__search" role="search" onSubmit={submitSearch}>
      <label className="sr-only" htmlFor={id}>Search products</label>
      <input id={id} type="search" value={query} placeholder="Search products…" autoComplete="off"
        onChange={(e) => setQuery(e.target.value)} />
      <button className="nav__searchbtn" type="submit" aria-label="Search"><Search size={17} width={2} /></button>
    </form>
  );

  const badge = ready && count > 0
    ? <span className="nav__badge" aria-hidden="true">{count}</span>
    : null;

  return (
    <header className="nav">
      <div className="container nav__top">
        {/* phone-only twin of the Menu button in the second row, which is hidden there */}
        <button className="nav__burger" type="button" onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen} aria-controls="mobile-nav"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
          <Menu />
        </button>

        <Link className="logo" href="/" aria-label="NOVA home">NOVA</Link>

        {searchField('site-search')}

        <div className="nav__actions">
          <Link className="nav__action" href="/account" aria-label="Your account"
            aria-current={pathname === '/account' ? 'page' : undefined}>
            <User size={23} />
          </Link>

          {isCartPage
            ? <Link className="nav__cart" href="/cart" aria-label="View cart"><Bag size={23} />{badge}</Link>
            : <button className="nav__cart" type="button" ref={cartButtonRef}
                      onClick={() => openDrawer(cartButtonRef.current)}
                      aria-label={'Open cart' + (count > 0 ? ', ' + count + ' items' : '')}>
                <Bag size={23} />{badge}
              </button>}
        </div>
      </div>

      <div className="nav__second">
        <div className="container nav__second-inner">
          <button className="nav__menu" type="button" onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen} aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
            <Menu />
            <span>Menu</span>
          </button>

          <div className="nav__cats" ref={catsRef}>
            <button className="nav__catsbtn" type="button" ref={catsButtonRef}
              onClick={() => setCatsOpen((o) => !o)} aria-expanded={catsOpen} aria-controls="all-categories">
              All Categories
              <ChevDown />
            </button>
            {catsOpen && (
              <div className="nav__drop" id="all-categories">
                {CATS.map((c) => (
                  <Link key={c.id} href={catHref(c.id)} onClick={() => setCatsOpen(false)}>{c.label}</Link>
                ))}
              </div>
            )}
          </div>

          <nav className="nav__links" aria-label="Main">
            <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Home</Link>
            <Link href="/shop" aria-current={pathname.startsWith('/shop') ? 'page' : undefined}>Shop</Link>
            {CATS.map((c, i) => (
              <Link key={c.id} href={catHref(c.id)} title={c.label}
                className={'nav__catlink' + (i >= 3 ? ' nav__catlink--extra' : '')}>
                {c.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {mobileOpen && (
        <div className="nav__mobile" id="mobile-nav">
          {searchField('mobile-search')}
          <nav className="nav__mobile-links" aria-label="Mobile">
            <Link href="/">Home</Link>
            <Link href="/shop">Shop</Link>
            {CATS.map((c) => (
              <Link key={c.id} className="nav__mobile-cat" href={catHref(c.id)}
                onClick={() => setMobileOpen(false)}>{c.label}</Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
