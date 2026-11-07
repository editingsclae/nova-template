'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { Chev, TickPlain, Warn } from '@/components/icons';
import { useCart } from '@/lib/cart';
import { money } from '@/lib/nova';

const ADDR_KEY = 'nova.checkout.address';
const ORDER_KEY = 'nova.checkout.lastOrder';
const ORDERS_KEY = 'nova.orders';
const NOTE_KEY = 'nova.note';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/* Aramex delivers nationwide, so the address form has one country and one carrier */
const COUNTRY = { code: 'TN', dd: '216', label: 'Tunisia (TN)', flag: '🇹🇳' };

const CITIES = ['Tunis', 'Ariana', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan',
  'Kasserine', 'Kébili', 'Le Kef', 'Mahdia', 'La Manouba', 'Médenine', 'Monastir', 'Nabeul',
  'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Zaghouan', 'Djerba'];

const EMPTY = {
  email: '', fname: '', lname: '', addr1: '', addr2: '',
  city: '', zip: '', phone: '', agree: false
};

/* accept 27123456, 27 123 456, +216 27 123 456 or 00216… and keep the local number */
function localPhone(raw) {
  const v = raw.replace(/\D/g, '');
  if (v.indexOf('00216') === 0) return v.slice(5);
  if (v.indexOf('216') === 0 && v.length > 8) return v.slice(3);
  return v;
}
function groupPhone(v) {
  return v.length === 8 ? v.slice(0, 2) + ' ' + v.slice(2, 5) + ' ' + v.slice(5) : v;
}
function orderNo() {
  const d = new Date();
  const pad = (n) => ('0' + n).slice(-2);
  return 'NV-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' +
    String(Math.floor(1000 + Math.random() * 9000));
}
function workingDays(from, days) {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 6) added++;
  }
  return d;
}
function etaFor() {
  return 'Arriving by ' + workingDays(new Date(), 5)
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

const Err = ({ msg }) => msg ? <p className="err"><Warn /><span>{msg}</span></p> : <p className="err" />;

export default function CheckoutView() {
  const { ready, lines, count, totals, clear } = useCart();
  const [f, setF] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [bar, setBar] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const timer = useRef(null);

  /* saved address */
  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem(ADDR_KEY));
      if (!a) return;
      setF({
        email: a.email || '', fname: a.fname || '', lname: a.lname || '',
        addr1: a.addr1 || '', addr2: a.addr2 || '', city: a.city || '', zip: a.zip || '',
        phone: a.phone || ''
      });
    } catch (e) { /* private mode */ }
  }, []);

  const t = useMemo(() => totals(), [totals]);
  const n = lines.reduce((a, l) => a + l.qty, 0);
  const emptyCart = ready && count === 0 && !done;

  const set = (k) => (e) => {
    let v = e.target.value;
    if (k === 'zip') v = v.replace(/[^\d]/g, '');
    const next = { ...f, [k]: v };
    setF(next);
    setBar(null);
    /* only re-check a field once it has already failed, so typing isn't nagged */
    if (errs[k]) validate(next, k);
  };

  /* ---------- validation ---------- */
  function messageFor(key, form) {
    const v = String(form[key] ?? '').trim();
    switch (key) {
      case 'email':
        if (!v) return ['Email address is required.'];
        if (!EMAIL_RE.test(v)) return ['Enter a valid email address.'];
        return [null];
      case 'fname': return [v ? null : 'Please enter your first name.'];
      case 'lname': return [v ? null : 'Please enter your last name.'];
      case 'addr1': return [v ? null : 'Please enter your street address.'];
      case 'city': return [v ? null : 'Please enter your city.'];
      case 'zip':
        if (!v) return ['Postal code is required.'];
        if (!/^\d{4}$/.test(v)) return ['Tunisian postal codes are 4 digits, e.g. 1002.'];
        return [null];
      case 'phone': {
        const local = localPhone(form.phone);
        if (!form.phone.trim()) return ['Phone number is required.'];
        if (!/^[0-9+\s().-]+$/.test(form.phone.trim())) return ['Digits only, please.'];
        if (!/^[2-5]\d{7}$/.test(local)) return ['Tunisian numbers have 8 digits starting with 2–5, e.g. 27 123 456.'];
        return [null];
      }
      case 'agree': return [form.agree ? null : 'Please confirm your address to continue.'];
      default: return [null];
    }
  }

  const KEYS = ['email', 'fname', 'lname', 'addr1', 'city', 'zip', 'phone', 'agree'];
  function validate(form, only) {
    const keys = only ? [only] : KEYS;
    const out = {};
    keys.forEach((k) => { out[k] = messageFor(k, form)[0]; });
    setErrs((cur) => {
      const next = { ...cur };
      keys.forEach((k) => { if (out[k]) next[k] = out[k]; else delete next[k]; });
      return next;
    });
    return keys.every((k) => !out[k]);
  }

  const collect = () => ({
    email: f.email.trim(), fname: f.fname.trim(), lname: f.lname.trim(),
    addr1: f.addr1.trim(), addr2: f.addr2.trim(),
    city: f.city.trim(), zip: f.zip.trim(),
    country: COUNTRY.code, countryLabel: COUNTRY.label,
    phone: localPhone(f.phone), dd: COUNTRY.dd
  });

  function saveOrder(a, tt, ls) {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch (e) { list = []; }
    list.unshift({
      number: a.order,
      placed: Date.now(),
      status: 'Order placed',
      merchant: 'NOVA',
      payment: 'pay on delivery',
      shipMethod: tt.method.method || 'Aramex',
      email: a.email,
      items: ls.map((l) => ({ id: l.id, name: l.name, sub: l.sub, img: l.img, size: l.size, qty: l.qty, unit: l.price, line: l.line })),
      totals: { items: tt.subtotal, shipping: tt.shipping, total: tt.total },
      address: {
        name: a.fname + ' ' + a.lname, addr1: a.addr1, addr2: a.addr2,
        city: a.city, zip: a.zip, country: a.countryLabel, phone: '+' + a.dd + a.phone
      }
    });
    try { localStorage.setItem(ORDERS_KEY, JSON.stringify(list.slice(0, 20))); } catch (e) { /* private mode */ }
  }

  const submit = (e) => {
    e.preventDefault();
    setBar(null);
    if (count === 0) {
      setBar({ kind: 'err', html: <>Your cart is empty — <Link href="/cart">add a pair</Link> first.</> });
      return;
    }
    const form = { ...f };
    if (!validate(form)) {
      const bad = KEYS.filter((k) => messageFor(k, form)[0])[0];
      const node = document.getElementById(bad);
      if (node) node.focus();
      setBar({ kind: 'err', html: 'Please fix the highlighted fields so the courier can reach you.' });
      return;
    }

    const a = collect();
    a.order = orderNo();
    const ls = lines;
    const tt = totals();

    try {
      localStorage.setItem(ADDR_KEY, JSON.stringify(a));
      localStorage.setItem(ORDER_KEY, JSON.stringify({ order: a.order, at: Date.now(), total: tt.total }));
      saveOrder(a, tt, ls);
    } catch (err) { /* private mode */ }

    setBusy(true);
    let note = '';
    timer.current = setTimeout(() => {
      try { note = localStorage.getItem(NOTE_KEY) || ''; } catch (err) { /* ignore */ }
      clear();
      try { localStorage.removeItem(NOTE_KEY); } catch (err) { /* private mode */ }
      setBusy(false);
      setDone({ a, t: tt, ls, note });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 900);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const fieldCls = (k) => 'field' + (errs[k] ? ' field--error' : '');
  const invalid = (k) => (errs[k] ? 'true' : undefined);

  const steps = done
    ? <div className="steps" aria-label="Checkout progress">
        <span className="step step--done"><i>✓</i><span className="step__label">Cart</span></span>
        <span className="step__rule step__rule--on" />
        <span className="step step--done"><i>✓</i><span className="step__label">Contact &amp; address</span></span>
        <span className="step__rule step__rule--on" />
        <span className="step step--done"><i>✓</i><span className="step__label">Order placed</span></span>
      </div>
    : <div className="steps" aria-label="Checkout progress">
        <span className="step step--done"><i>✓</i><span className="step__label">Cart</span></span>
        <span className="step__rule step__rule--on" />
        <span className="step step--on"><i>2</i><span className="step__label">Contact &amp; address</span></span>
        <span className="step__rule" />
        <span className="step step--on"><i>3</i><span className="step__label">Shipping &amp; payment</span></span>
      </div>;

  return (
    <div className="shop">
      <SiteHeader />

      <main className="container">
        <div className="pagehead">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><Chev />
            <Link href="/cart">Cart</Link><Chev />
            <span>Checkout</span>
          </nav>
          <h1>{done ? 'Thank you, ' + done.a.fname : 'Checkout'}</h1>
          <p>{done
            ? 'Your order is reserved. Nothing has been charged — you pay in cash on delivery.'
            : 'Three short steps. No card needed — cash on delivery is available everywhere we ship.'}</p>
          {steps}
        </div>

        {!done
          ? <div className="ck__layout">
              <form className="ck__col" onSubmit={submit} noValidate>
                <section className="panel">
                  <div className="panel__head"><span className="panel__n">1</span><h2>Contact &amp; shipping address</h2></div>

                  <div className={fieldCls('email')}>
                    <div className="field__head"><label htmlFor="email">Email address</label></div>
                    <div className="control control--icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6.5 9 6 9-6" /></svg>
                      <input id="email" name="email" type="email" inputMode="email" autoComplete="email"
                             placeholder="you@example.com" value={f.email} onChange={set('email')}
                             aria-invalid={invalid('email')} />
                    </div>
                    <Err msg={errs.email} />
                    <p className="hint">Only for the order confirmation and delivery tracking link.</p>
                  </div>

                  <div className="grid2">
                    <div className={fieldCls('fname')}>
                      <div className="field__head"><label htmlFor="fname">First name</label></div>
                      <div className="control">
                        <input id="fname" name="fname" type="text" autoComplete="given-name" placeholder="Avery"
                               value={f.fname} onChange={set('fname')} aria-invalid={invalid('fname')} />
                      </div>
                      <Err msg={errs.fname} />
                    </div>
                    <div className={fieldCls('lname')}>
                      <div className="field__head"><label htmlFor="lname">Last name</label></div>
                      <div className="control">
                        <input id="lname" name="lname" type="text" autoComplete="family-name" placeholder="Nova"
                               value={f.lname} onChange={set('lname')} aria-invalid={invalid('lname')} />
                      </div>
                      <Err msg={errs.lname} />
                    </div>
                  </div>

                  <div className={fieldCls('addr1')}>
                    <div className="field__head"><label htmlFor="addr1">Address</label></div>
                    <div className="control control--icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V9.5L12 4l8 5.5V20" /><path d="M9.5 20v-6h5v6" /></svg>
                      <input id="addr1" name="addr1" type="text" autoComplete="address-line1"
                             placeholder="Street, building number" value={f.addr1} onChange={set('addr1')}
                             aria-invalid={invalid('addr1')} />
                    </div>
                    <Err msg={errs.addr1} />
                  </div>

                  <div className="field">
                    <div className="field__head">
                      <label htmlFor="addr2">Apartment, floor, landmark <span className="field__opt">(optional)</span></label>
                    </div>
                    <div className="control">
                      <input id="addr2" name="addr2" type="text" autoComplete="address-line2"
                             placeholder="Bloc 4, Apt 12 — near the pharmacy" value={f.addr2} onChange={set('addr2')} />
                    </div>
                  </div>

                  <div className="grid2">
                    <div className={fieldCls('city')}>
                      <div className="field__head"><label htmlFor="city">City</label></div>
                      <div className="control control--icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18M6 20V7l5-3v16M11 20V11l7 3v6M14.5 14.5h.01M16.5 17h.01" /></svg>
                        <input id="city" name="city" list="cities" type="text" autoComplete="address-level2"
                               placeholder="Tunis" value={f.city} onChange={set('city')} aria-invalid={invalid('city')} />
                      </div>
                      <datalist id="cities">
                        {CITIES.map((c) => <option value={c} key={c} />)}
                      </datalist>
                      <Err msg={errs.city} />
                    </div>
                    <div className={fieldCls('zip')}>
                      <div className="field__head"><label htmlFor="zip">Postal code</label></div>
                      <div className="control">
                        <input id="zip" name="zip" type="text" inputMode="numeric" autoComplete="postal-code"
                               placeholder="1002" maxLength="5"
                               value={f.zip} onChange={set('zip')} aria-invalid={invalid('zip')} />
                      </div>
                      <Err msg={errs.zip} />
                    </div>
                  </div>

                  <div className="grid2">
                    <div className="field">
                      <div className="field__head"><label htmlFor="country">Country</label></div>
                      <div className="control control--icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3.2 9.5h17.6M3.2 14.5h17.6M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
                        <input id="country" name="country" type="text" autoComplete="country-name"
                               value={COUNTRY.label} readOnly aria-readonly="true" />
                      </div>
                      <p className="hint">We ship to every governorate with Aramex.</p>
                    </div>
                    <div className={fieldCls('phone')}>
                      <div className="field__head"><label htmlFor="phone">Phone number</label></div>
                      <div className="phone">
                        <span className="phone__cc"><i>{COUNTRY.flag}</i><span>+{COUNTRY.dd}</span></span>
                        <div className="control">
                          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national"
                                 placeholder="27 123 456" value={f.phone} onChange={set('phone')}
                                 aria-invalid={invalid('phone')} />
                        </div>
                      </div>
                      <Err msg={errs.phone} />
                      <p className="hint">The courier calls before arriving — 8 digits, no leading zero.</p>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel__head"><span className="panel__n">2</span><h2>Shipping option</h2></div>
                  <div className="opts">
                    <label className="optcard">
                      <input type="radio" name="ship" value={t.method.id} checked readOnly />
                      <span className="optcard__ui">
                        <span className="optcard__dot" />
                        <span>
                          <span className="optcard__label">{t.method.label}</span>
                          <span className="optcard__eta">{t.method.eta}</span>
                        </span>
                        <span className="optcard__price">{money(t.method.cost)}</span>
                      </span>
                    </label>
                  </div>
                  <p className="hint">Delivery runs Sunday to Friday across Tunisia.</p>
                </section>

                <section className="panel">
                  <div className="panel__head"><span className="panel__n">3</span><h2>Payment &amp; order placement</h2></div>
                  <div className="paylist">
                    <label className="pay">
                      <input type="radio" name="pay" value="cod" checked readOnly />
                      <span className="pay__ui">
                        <span className="optcard__dot" />
                        <span>
                          <span className="pay__label">Cash on delivery</span>
                          <span className="pay__desc">Pay the courier in cash when your pair arrives. Please have the exact amount ready.</span>
                        </span>
                        <span className="pay__ico"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.5h19v10h-19z" /><circle cx="12" cy="12.5" r="2.6" /><path d="M5.5 10.5h.01M18.5 14.5h.01" /></svg></span>
                      </span>
                    </label>
                  </div>

                  {emptyCart
                    ? <div className="codbox codbox--warn">
                        <Warn size={15} />
                        <span><b>Your cart is empty.</b> <Link href="/cart" style={{ fontWeight: 600, textDecoration: 'underline' }}>Add a pair</Link> before placing an order.</span>
                      </div>
                    : <div className="codbox">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16.5v-5m0-3.2v-.3" /></svg>
                        <span>Have <b>{money(t.total)}</b> ready in cash. The courier carries no change above TND 20 — please keep notes and coins handy.</span>
                      </div>}

                  <div className={fieldCls('agree')} style={{ marginTop: 22 }}>
                    <label className="opt">
                      <input type="checkbox" id="agree" checked={!!f.agree}
                             onChange={(e) => {
                               const next = { ...f, agree: e.target.checked };
                               setF(next);
                               if (errs.agree) validate(next, 'agree');
                             }} />
                      <span className="opt__box"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4.5 4.5L19 7" /></svg></span>
                      <span>I confirm my address is correct and accept the <Link href="/terms">terms of sale</Link> and <Link href="/returns">return policy</Link>.</span>
                    </label>
                    <Err msg={errs.agree} />
                  </div>

                  <div className={'notice' + (bar ? ' notice--' + bar.kind : '')} role="status" aria-live="polite"
                       {...(bar ? { 'data-show': '' } : {})}>
                    {bar ? <span>{bar.html}</span> : null}
                  </div>

                  <button className="btn btn--dark btn--block" type="submit" disabled={count === 0}
                          data-busy="Placing order…">
                    {busy ? <><span className="btn__spin" />Placing order…</> : 'Place order · ' + money(t.total)}
                  </button>
                </section>
              </form>

              <aside className="ck__summary">
                <div className="sumcard">
                  <h2>Order summary</h2>
                  <div className="sumitems">
                    {lines.map((l) => (
                      <div className="sline" key={l.i}>
                        <div className="sline__media">
                          <img src={'/images/' + l.img + '.png'} alt="" />
                          <span className="sline__n">{l.qty}</span>
                        </div>
                        <div>
                          <p className="sline__name">{l.name}</p>
                          <p className="sline__meta">EU {l.size}</p>
                        </div>
                        <p className="sline__price">{money(l.line)}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="sumrow"><span>Subtotal <em>({n} {n === 1 ? 'item' : 'items'})</em></span><b>{money(t.subtotal)}</b></div>
                    <div className="sumrow"><span>{t.method.label} delivery</span><b>{money(t.shipping)}</b></div>
                    <div className="sumrow"><span>Cash on delivery fee</span><b>{money(0)}</b></div>
                    <div className="sumrow sumrow--total"><span>Total due on delivery</span><b>{money(t.total)}</b></div>
                  </div>
                  <div className="ck__payline">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="6" width="19" height="13" rx="2" /><path d="M2.5 10h19" /><circle cx="17" cy="14.5" r="1" /></svg>
                    <span>Paying with <b>Cash on delivery</b></span>
                  </div>
                  <p className="ck__legal">Placing this order creates a reservation only. Nothing is charged online; you hand the amount to the courier when your parcel is delivered.</p>
                </div>
                <div style={{ marginTop: 14 }}>
                  <Link className="btn btn--ghost" href="/cart">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
                    Edit cart
                  </Link>
                </div>
              </aside>
            </div>
          : null}

        {done
          ? <div className="conf">
              <div className="conf__card">
                <div className="conf__tick"><TickPlain /></div>
                <h1>Order placed</h1>
                <p className="conf__lede">We’ve emailed a confirmation to <b>{done.a.email}</b>. The courier will call <b>+{done.a.dd} {groupPhone(done.a.phone)}</b> before arriving.</p>

                <div className="conf__grid">
                  <div><p className="conf__k">Order number</p><p className="conf__v"><b>{done.a.order}</b></p></div>
                  <div><p className="conf__k">Delivery</p><p className="conf__v">{etaFor()}</p></div>
                  <div>
                    <p className="conf__k">Ship to</p>
                    <p className="conf__v">
                      {done.a.fname} {done.a.lname}<br />{done.a.addr1}
                      {done.a.addr2 ? <><br />{done.a.addr2}</> : null}<br />
                      {done.a.city} {done.a.zip}<br />{done.a.countryLabel}
                    </p>
                  </div>
                  <div><p className="conf__k">Payment</p><p className="conf__v">Cash on delivery<br /><b>{money(done.t.total)}</b> due when the parcel arrives</p></div>
                </div>

                {done.note
                  ? <div className="codbox" style={{ marginTop: 26 }}>
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></svg>
                      <span><b>Note sent to the courier:</b> {done.note}</span>
                    </div>
                  : null}

                <div className="conf__items">
                  <h2>Your items</h2>
                  {done.ls.map((l) => (
                    <div className="sline" style={{ marginBottom: 14 }} key={l.i}>
                      <div className="sline__media">
                        <img src={'/images/' + l.img + '.png'} alt="" />
                        <span className="sline__n">{l.qty}</span>
                      </div>
                      <div>
                        <p className="sline__name">{l.name}</p>
                        <p className="sline__meta">EU {l.size} · {l.sub}</p>
                      </div>
                      <p className="sline__price">{money(l.line)}</p>
                    </div>
                  ))}
                  <div className="sumrow sumrow--total" style={{ borderTop: '1px solid var(--line)' }}>
                    <span>Total due on delivery</span><b className="conf__total">{money(done.t.total)}</b>
                  </div>
                </div>

                <div className="conf__acts">
                  <Link className="btn btn--dark btn--wide" href="/shop">Continue shopping</Link>
                  <Link className="btn btn--ghost" href="/">Back to home</Link>
                </div>
              </div>
            </div>
          : null}
      </main>

      <SiteFooter />
    </div>
  );
}
