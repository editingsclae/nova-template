'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { Chev } from '@/components/icons';
import { byId, money, productUrl } from '@/lib/nova';

const SESSION = 'nova.session';
const ORDERS = 'nova.orders';
const PROFILE = 'nova.account.profile';
const REMEMBERED = 'nova.remembered';

/* reference account shown when nobody has signed in on this device */
const DEMO = { name: 'Alouini Firas', email: '979adriaens@fldubai.com', confirmed: true, confirmedAt: '12 Oct 2026' };

const SEED = [{
  number: '52',
  placed: +new Date(2026, 10, 1, 9, 40),
  status: 'Order placed',
  merchant: 'ZARA',
  payment: 'pay on delivery',
  fulfillment: 'Order placed',
  contact: '979adriaens@fldubai.com',
  shipMethod: 'Aramex',
  items: [{ id: 'air-pro', name: 'Nova Air Pro', sub: 'Everyday Comfort', img: 'prod-airpro', size: 42, qty: 1, unit: 563, line: 563 }],
  totals: { items: 563, shipping: 10, total: 573 },
  address: {
    name: 'Alouini Firas', street: 'Av Monji Slim', city: 'Tunis', zip: '1000',
    country: 'Tunisia (TN)', phone: '+21620514118'
  }
}];

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
}
function dateOf(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function normalise(o) {
  const a = o.address || {};
  return {
    number: String(o.number),
    placed: o.placed,
    status: o.status || 'Order placed',
    merchant: o.merchant || 'NOVA',
    payment: o.payment || 'pay on delivery',
    fulfillment: o.fulfillment || o.status || 'Order placed',
    contact: o.contact || o.email || '',
    shipMethod: o.shipMethod || 'Aramex',
    items: (o.items || []).map((l) => {
      const p = byId(l.id) || {};
      return {
        id: l.id || p.id || '',
        name: l.name || p.name || 'Nova pair', sub: l.sub || p.sub || '',
        img: l.img || p.img || 'prod-airpro', size: l.size, qty: l.qty,
        unit: l.unit != null ? l.unit : (p.price || 0),
        line: l.line != null ? l.line : (p.price || 0) * l.qty
      };
    }),
    totals: o.totals || { items: 0, shipping: 0, total: 0 },
    address: {
      name: a.name || '', street: a.street || a.addr1 || '', addr2: a.addr2 || '',
      city: a.city || '', zip: a.zip || '', country: a.country || 'Tunisia (TN)', phone: a.phone || ''
    }
  };
}
function storedOrders() { return read(ORDERS, []).concat(SEED).map(normalise).sort((x, y) => y.placed - x.placed); }

const Tick = ({ size = 13 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
const Clock = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 1.8" /></svg>
);

function OrderDetail({ o }) {
  const a = o.address;
  const street = [a.street, a.addr2].filter(Boolean).join(', ');
  return (
    <>
      <div className="odetail__grid">
        <div className="oitems">
          <h3>Items ({o.items.length})</h3>
          {o.items.map((l, k) => (
            <div className="oline" key={k}>
              <div className="sline__media">
                <img src={'/images/' + l.img + '.png'} alt="" />
                <span className="sline__n">{l.qty}</span>
              </div>
              <div>
                <p className="sline__name">
                  {l.id ? <Link className="plink" href={productUrl(l.id)}>{l.name}</Link> : l.name}
                </p>
                <p className="oline__meta">Qty: {l.qty} • Unit: {money(l.unit, 1)}{l.size ? ' • EU ' + l.size : ''}</p>
              </div>
              <p className="sline__price">{money(l.line)}</p>
            </div>
          ))}
        </div>

        <div>
          <h3>Shipping Information</h3>
          <address className="oaddr">{a.name}<br />{street}<br />{a.city}, {a.zip}<br />{a.country}</address>
          <dl className="okv">
            <div><dt>Method</dt><dd>{o.shipMethod}</dd></div>
            <div><dt>Phone</dt><dd><a href={'tel:' + a.phone.replace(/\D/g, '')}>{a.phone}</a></dd></div>
          </dl>
        </div>

        <div>
          <h3>Payment &amp; Fulfillment</h3>
          <dl className="okv">
            <div><dt>Merchant</dt><dd>{o.merchant}</dd></div>
            <div><dt>Payment</dt><dd>{o.payment}</dd></div>
            <div><dt>Fulfillment</dt><dd>{o.fulfillment}</dd></div>
            <div><dt>Contact</dt><dd>{o.contact ? <a href={'mailto:' + o.contact}>{o.contact}</a> : '—'}</dd></div>
          </dl>
        </div>

        <div>
          <h3>Payment breakdown</h3>
          <div className="oledger">
            <div className="sumrow"><span>Items:</span><b>{money(o.totals.items)}</b></div>
            <div className="sumrow"><span>Shipping:</span><b>{o.totals.shipping === 0 ? 'Free' : money(o.totals.shipping)}</b></div>
            <div className="sumrow sumrow--total"><span>Total:</span><b>{money(o.totals.total)}</b></div>
          </div>
          <p className="ck__legal">Cash on delivery — hand the courier <b>{money(o.totals.total)}</b> when the parcel arrives. Nothing has been charged online.</p>
        </div>
      </div>
    </>
  );
}

export default function AccountView() {
  const router = useRouter();
  const [prof, setProf] = useState(DEMO);
  const [list, setList] = useState(() => SEED.map(normalise).sort((x, y) => y.placed - x.placed));
  const [pane, setPane] = useState('profile');
  const [open, setOpen] = useState(null);

  /* localStorage is only reachable on the client, so the first paint uses the demo account */
  useEffect(() => {
    const saved = read(PROFILE, null);
    const session = read(SESSION, null);
    setProf(saved
      ? { name: saved.name, email: saved.email, confirmed: !!saved.confirmed, confirmedAt: saved.confirmedAt }
      : session
        ? { name: session.name, email: session.email, confirmed: true, confirmedAt: DEMO.confirmedAt }
        : DEMO);
    setList(storedOrders());

    const hash = (window.location.hash || '').replace('#', '');
    if (hash.indexOf('order-') === 0) { setOpen(+hash.slice(6)); setPane('orders'); }
    else if (hash === 'orders') setPane('orders');
  }, []);

  const showPane = (which) => {
    setPane(which);
    try { window.history.replaceState(null, '', '#' + which); } catch (e) { /* ignore */ }
  };
  const onTabKeys = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = e.target.getAttribute('data-pane') === 'profile' ? 'orders' : 'profile';
    showPane(next);
    document.getElementById('tab-' + next)?.focus();
  };

  const confirmNow = () => {
    write(PROFILE, { name: prof.name, email: prof.email, confirmed: true, confirmedAt: dateOf(Date.now()) });
    setProf({ ...prof, confirmed: true, confirmedAt: dateOf(Date.now()) });
  };

  const signOut = () => {
    try {
      localStorage.removeItem(SESSION);
      localStorage.removeItem(REMEMBERED);
    } catch (e) { /* ignore */ }
    router.push('/login');
  };

  const qtyPhrase = (items) => {
    const n = items.reduce((a, l) => a + l.qty, 0);
    return n === 1 ? '1 item' : n + ' items';
  };

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
              <span className="ac__avatar">{initialsOf(prof.name)}</span>
              <div>
                <p className="ac__who-name">{prof.name}</p>
                <p className="ac__who-mail">{prof.email}</p>
              </div>
            </div>

            <nav className="ac__tabs" role="tablist" aria-label="Account sections" onKeyDown={onTabKeys}>
              <button className={'ac__tab' + (pane === 'profile' ? ' is-on' : '')} type="button" role="tab"
                      aria-selected={pane === 'profile'} aria-controls="pane-profile" id="tab-profile" data-pane="profile"
                      onClick={() => showPane('profile')}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
                Profile
              </button>
              <button className={'ac__tab' + (pane === 'orders' ? ' is-on' : '')} type="button" role="tab"
                      aria-selected={pane === 'orders'} aria-controls="pane-orders" id="tab-orders" data-pane="orders"
                      onClick={() => showPane('orders')}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9.5 8a2.5 2.5 0 0 1 5 0" /></svg>
                My orders
                <span className="ac__tab-n">{list.length}</span>
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
            <section className="panel ac__pane" id="pane-profile" role="tabpanel" aria-labelledby="tab-profile" hidden={pane !== 'profile'}>
              <div className="panel__head">
                <h2>Profile</h2>
              </div>

              <dl className="ac__facts">
                <div className="ac__fact">
                  <dt>User full name</dt>
                  <dd>{prof.name}<small>Shown on the delivery label and read out to the courier.</small></dd>
                </div>
                <div className="ac__fact">
                  <dt>Email</dt>
                  <dd>{prof.email}<small>Order confirmations and tracking links go here.</small></dd>
                </div>
                <div className="ac__fact">
                  <dt>Email confirmed</dt>
                  {prof.confirmed
                    ? <dd><span className="pill pill--ok"><Tick />Confirmed</span><small>Verified on {prof.confirmedAt}.</small></dd>
                    : <dd>
                        <span className="pill pill--wait"><Clock />Awaiting confirmation</span>
                        <small>Open the link we sent to {prof.email}, or <button className="linkbtn" type="button" onClick={confirmNow}>confirm it here</button> in this demo.</small>
                      </dd>}
                </div>
              </dl>
            </section>

            <section className="panel ac__pane" id="pane-orders" role="tabpanel" aria-labelledby="tab-orders" hidden={pane !== 'orders'}>
              <div className="panel__head">
                <h2>My orders</h2>
                <p className="panel__head-note">{list.length ? dateOf(list[0].placed) + ' · newest first' : ''}</p>
              </div>
              <div className="oorder-list">
                {list.map((o, i) => (
                  <div className="oorder" key={o.number}>
                    <button className="oorder__btn" type="button" aria-expanded={open === i}
                            aria-controls={'detail-' + i} onClick={() => setOpen(open === i ? null : i)}>
                      <span className="oorder__no">Order #{o.number}</span>
                      <span className="oorder__items">{dateOf(o.placed)} • {qtyPhrase(o.items)}</span>
                      <span className="oorder__status"><span className="pill pill--ok"><Tick />{o.status}</span></span>
                      <span className="oorder__total"><small>Total</small>{money(o.totals.total, 1)}</span>
                      <span className="oorder__chev"><Chev size={13} /></span>
                    </button>
                    <div className="odetail" id={'detail-' + i} role="region"
                         aria-label={'Order ' + o.number + ' details'} hidden={open !== i}>
                      {open === i ? <OrderDetail o={o} /> : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="ac__noorders" hidden={list.length > 0}>
                <h3>No orders yet</h3>
                <p>When you place an order it appears here with its cash-on-delivery amount and courier details.</p>
                <Link className="btn btn--dark" href="/shop">Browse the shop</Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
