'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { Chev, TickPlain, Warn } from '@/components/icons';
import { useCart } from '@/lib/cart';
import {
  formatPrice,
  getShippingOptions,
  updateCart,
  setCartCustomer,
  createPaymentCollection,
  initiatePaymentSession,
  completeCart,
  cleanVariantTitle,
} from '@/lib/medusa';

const ADDR_KEY = 'nova.checkout.address';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const COUNTRY = { code: 'tn', dd: '216', label: 'Tunisia (TN)', flag: '🇹🇳' };

const CITIES = [
  'Tunis', 'Ariana', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan',
  'Kasserine', 'Kébili', 'Le Kef', 'Mahdia', 'La Manouba', 'Médenine', 'Monastir', 'Nabeul',
  'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Zaghouan', 'Djerba'
];

const EMPTY = {
  email: '',
  fname: '',
  lname: '',
  addr1: '',
  addr2: '',
  city: '',
  zip: '',
  phone: '',
  agree: false,
};

function localPhone(raw) {
  const v = raw.replace(/\D/g, '');
  if (v.indexOf('00216') === 0) return v.slice(5);
  if (v.indexOf('216') === 0 && v.length > 8) return v.slice(3);
  return v;
}

const Err = ({ msg }) => (msg ? <p className="err"><Warn /><span>{msg}</span></p> : <p className="err" />);

export default function CheckoutView() {
  const router = useRouter();
  const { cart, cartId, ready, lines, count, totals, setShippingMethod } = useCart();
  const [f, setF] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [bar, setBar] = useState(null);
  const [busy, setBusy] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Shipping options state
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [shippingError, setShippingError] = useState(null);
  const [selectedShippingId, setSelectedShippingId] = useState(null);

  const fetchedCartIdRef = useRef(null);
  const hasLoadedShippingRef = useRef(false);
  const shippingMethodsRef = useRef(cart?.shipping_methods);
  shippingMethodsRef.current = cart?.shipping_methods;

  // Prefill saved address if available
  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem(ADDR_KEY));
      if (!a) return;
      setF((cur) => ({
        ...cur,
        email: a.email || '',
        fname: a.fname || '',
        lname: a.lname || '',
        addr1: a.addr1 || '',
        addr2: a.addr2 || '',
        city: a.city || '',
        zip: a.zip || '',
        phone: a.phone || '',
      }));
    } catch (e) {
      /* private mode */
    }
  }, []);

  // Fetch real shipping options for the cart (Rules 9, 17)
  useEffect(() => {
    if (!cartId) {
      setShippingLoading(false);
      return;
    }

    if (busy || orderPlaced) return;
    if (fetchedCartIdRef.current === cartId) return;

    fetchedCartIdRef.current = cartId;
    let active = true;

    if (!hasLoadedShippingRef.current) {
      setShippingLoading(true);
    }

    getShippingOptions(cartId)
      .then((opts) => {
        if (!active) return;
        hasLoadedShippingRef.current = true;
        const list = Array.isArray(opts) ? opts : [];
        setShippingOptions(list);

        if (list.length === 0) {
          // Rule 9: show clear "shipping is not set up yet" message
          setShippingError('Shipping is not set up yet. Please check back later.');
        } else {
          setShippingError(null);
          // Pick currently selected option on cart, or default to the first one
          const currentMethodId = shippingMethodsRef.current?.[0]?.shipping_option_id;
          const matched = list.find((o) => o.id === currentMethodId);
          const pick = matched ? matched.id : list[0].id;
          setSelectedShippingId(pick);

          // If cart does not have this shipping method set yet, set it now
          if (!matched && setShippingMethod) {
            setShippingMethod(pick).catch((e) => {
              console.error('[checkout] Default shipping method error:', e);
            });
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        hasLoadedShippingRef.current = true;
        console.error('[checkout] Failed to load shipping options:', err);
        setShippingError('Shipping is not set up yet. Please check back later.');
      })
      .finally(() => {
        if (active) setShippingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cartId, busy, orderPlaced, setShippingMethod]);

  const t = useMemo(() => totals(), [totals]);
  const n = lines.reduce((a, l) => a + l.qty, 0);
  const emptyCart = ready && count === 0 && !busy && !orderPlaced;

  const set = (k) => (e) => {
    let v = e.target.value;
    if (k === 'zip') v = v.replace(/[^\d]/g, '');
    const next = { ...f, [k]: v };
    setF(next);
    setBar(null);
    if (errs[k]) validate(next, k);
  };

  /* Validation */
  function messageFor(key, form) {
    const v = String(form[key] ?? '').trim();
    switch (key) {
      case 'email':
        if (!v) return ['Email address is required.'];
        if (!EMAIL_RE.test(v)) return ['Enter a valid email address.'];
        return [null];
      case 'fname':
        return [v ? null : 'Please enter your first name.'];
      case 'lname':
        return [v ? null : 'Please enter your last name.'];
      case 'addr1':
        return [v ? null : 'Please enter your street address.'];
      case 'city':
        return [v ? null : 'Please enter your city.'];
      case 'zip':
        if (!v) return ['Postal code is required.'];
        if (!/^\d{4}$/.test(v)) return ['Tunisian postal codes are 4 digits, e.g. 1002.'];
        return [null];
      case 'phone': {
        const local = localPhone(form.phone);
        if (!form.phone.trim()) return ['Phone number is required.'];
        if (!/^[0-9+\s().-]+$/.test(form.phone.trim())) return ['Digits only, please.'];
        if (!/^[2-9]\d{7}$/.test(local)) {
          return ['Tunisian numbers have 8 digits, e.g. 27 123 456.'];
        }
        return [null];
      }
      case 'agree':
        return [form.agree ? null : 'Please confirm your address to continue.'];
      default:
        return [null];
    }
  }

  const KEYS = ['email', 'fname', 'lname', 'addr1', 'city', 'zip', 'phone', 'agree'];

  function validate(form, only) {
    const keys = only ? [only] : KEYS;
    const out = {};
    keys.forEach((k) => {
      out[k] = messageFor(k, form)[0];
    });
    setErrs((cur) => {
      const next = { ...cur };
      keys.forEach((k) => {
        if (out[k]) next[k] = out[k];
        else delete next[k];
      });
      return next;
    });
    return keys.every((k) => !out[k]);
  }

  const collect = () => ({
    email: f.email.trim(),
    fname: f.fname.trim(),
    lname: f.lname.trim(),
    addr1: f.addr1.trim(),
    addr2: f.addr2.trim(),
    city: f.city.trim(),
    zip: f.zip.trim(),
    country: COUNTRY.code,
    countryLabel: COUNTRY.label,
    phone: localPhone(f.phone),
    dd: COUNTRY.dd,
  });

  const handleShippingSelect = async (optId) => {
    setSelectedShippingId(optId);
    setBar(null);
    try {
      await setShippingMethod(optId);
    } catch (err) {
      console.error('[checkout] Shipping select error:', err);
      setBar({ kind: 'err', html: 'Failed to update shipping method. Please try again.' });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBar(null);

    if (count === 0 || !cartId) {
      setBar({
        kind: 'err',
        html: <>Your cart is empty — <Link href="/cart">add a pair</Link> first.</>,
      });
      return;
    }

    if (shippingOptions.length === 0 || shippingError) {
      setBar({
        kind: 'err',
        html: shippingError || 'Shipping is not set up yet. Please check back later.',
      });
      return;
    }

    const form = { ...f };
    if (!validate(form)) {
      const bad = KEYS.filter((k) => messageFor(k, form)[0])[0];
      const node = document.getElementById(bad);
      if (node) node.focus();
      setBar({
        kind: 'err',
        html: 'Please fix the highlighted fields so the courier can reach you.',
      });
      return;
    }

    setBusy(true);

    try {
      // Rule 13: if customer token exists and cart has no customer_id, link it before completion
      const customerToken =
        typeof window !== 'undefined' ? localStorage.getItem('medusa_token') : null;
      if (customerToken && !cart?.customer_id) {
        try {
          await setCartCustomer(cartId, customerToken);
        } catch (e) {
          console.warn('[checkout] setCartCustomer ignored:', e);
        }
      }

      // 1. Update cart address and email
      const addrData = {
        first_name: f.fname.trim(),
        last_name: f.lname.trim(),
        address_1: f.addr1.trim(),
        address_2: f.addr2 ? f.addr2.trim() : '',
        city: f.city.trim(),
        postal_code: f.zip.trim(),
        country_code: COUNTRY.code,
        phone: f.phone.trim(),
      };

      await updateCart(cartId, {
        email: f.email.trim(),
        shipping_address: addrData,
        billing_address: addrData,
      });

      // 2. Ensure selected shipping method is set on cart
      if (selectedShippingId) {
        await setShippingMethod(selectedShippingId);
      }

      // 3. Create payment collection & session for cash on delivery (pp_system_default)
      const pc = await createPaymentCollection(cartId);
      if (!pc?.id) throw new Error('Could not create payment collection');

      await initiatePaymentSession(pc.id, 'pp_system_default');

      // 4. Complete order
      const completed = await completeCart(cartId);

      if (completed?.type === 'order' && completed?.order?.id) {
        setOrderPlaced(true);
        // Save address for user convenience
        try {
          localStorage.setItem(ADDR_KEY, JSON.stringify(collect()));
        } catch (err) {}

        // Navigate to confirmed page (cart is cleared on confirmed page)
        router.push(`/order/confirmed?id=${completed.order.id}`);
        return;
      }

      if (completed?.error) {
        throw new Error(completed.error.message || 'Order could not be completed.');
      }

      throw new Error('Unexpected completion response');
    } catch (err) {
      console.error('[checkout] Order submission error:', err);
      const msg =
        err?.data?.message || err?.message || 'Could not place order. Please try again.';
      setBar({ kind: 'err', html: msg });
      setBusy(false);
    }
  };

  const fieldCls = (k) => 'field' + (errs[k] ? ' field--error' : '');
  const invalid = (k) => (errs[k] ? 'true' : undefined);

  const steps = (
    <div className="steps" aria-label="Checkout progress">
      <span className="step step--done">
        <i>✓</i><span className="step__label">Cart</span>
      </span>
      <span className="step__rule step__rule--on" />
      <span className="step step--on">
        <i>2</i><span className="step__label">Contact &amp; address</span>
      </span>
      <span className="step__rule" />
      <span className="step step--on">
        <i>3</i><span className="step__label">Shipping &amp; payment</span>
      </span>
    </div>
  );

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
          <h1>Checkout</h1>
          <p>
            Three short steps. No card needed — cash on delivery is available everywhere we ship.
          </p>
          {steps}
        </div>

        <div className="ck__layout">
          <form className="ck__col" onSubmit={submit} noValidate>
            <section className="panel">
              <div className="panel__head">
                <span className="panel__n">1</span>
                <h2>Contact &amp; shipping address</h2>
              </div>

              <div className={fieldCls('email')}>
                <div className="field__head"><label htmlFor="email">Email address</label></div>
                <div className="control control--icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6.5 9 6 9-6" /></svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={f.email}
                    onChange={set('email')}
                    aria-invalid={invalid('email')}
                  />
                </div>
                <Err msg={errs.email} />
                <p className="hint">We’ll send your order confirmation and tracking link here.</p>
              </div>

              <div className="grid2">
                <div className={fieldCls('fname')}>
                  <div className="field__head"><label htmlFor="fname">First name</label></div>
                  <div className="control">
                    <input
                      id="fname"
                      name="fname"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Avery"
                      value={f.fname}
                      onChange={set('fname')}
                      aria-invalid={invalid('fname')}
                    />
                  </div>
                  <Err msg={errs.fname} />
                </div>
                <div className={fieldCls('lname')}>
                  <div className="field__head"><label htmlFor="lname">Last name</label></div>
                  <div className="control">
                    <input
                      id="lname"
                      name="lname"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Ben"
                      value={f.lname}
                      onChange={set('lname')}
                      aria-invalid={invalid('lname')}
                    />
                  </div>
                  <Err msg={errs.lname} />
                </div>
              </div>

              <div className={fieldCls('addr1')}>
                <div className="field__head"><label htmlFor="addr1">Address</label></div>
                <div className="control control--icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V9.5L12 4l8 5.5V20" /><path d="M9.5 20v-6h5v6" /></svg>
                  <input
                    id="addr1"
                    name="addr1"
                    type="text"
                    autoComplete="address-line1"
                    placeholder="Street, building number"
                    value={f.addr1}
                    onChange={set('addr1')}
                    aria-invalid={invalid('addr1')}
                  />
                </div>
                <Err msg={errs.addr1} />
              </div>

              <div className="field">
                <div className="field__head">
                  <label htmlFor="addr2">
                    Apartment, floor, landmark <span className="field__opt">(optional)</span>
                  </label>
                </div>
                <div className="control">
                  <input
                    id="addr2"
                    name="addr2"
                    type="text"
                    autoComplete="address-line2"
                    placeholder="Bloc 4, Apt 12 — near the pharmacy"
                    value={f.addr2}
                    onChange={set('addr2')}
                  />
                </div>
              </div>

              <div className="grid2">
                <div className={fieldCls('city')}>
                  <div className="field__head"><label htmlFor="city">City</label></div>
                  <div className="control control--icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18M6 20V7l5-3v16M11 20V11l7 3v6M14.5 14.5h.01M16.5 17h.01" /></svg>
                    <input
                      id="city"
                      name="city"
                      list="cities"
                      type="text"
                      autoComplete="address-level2"
                      placeholder="Tunis"
                      value={f.city}
                      onChange={set('city')}
                      aria-invalid={invalid('city')}
                    />
                  </div>
                  <datalist id="cities">
                    {CITIES.map((c) => (
                      <option value={c} key={c} />
                    ))}
                  </datalist>
                  <Err msg={errs.city} />
                </div>
                <div className={fieldCls('zip')}>
                  <div className="field__head"><label htmlFor="zip">Postal code</label></div>
                  <div className="control">
                    <input
                      id="zip"
                      name="zip"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="1002"
                      maxLength="5"
                      value={f.zip}
                      onChange={set('zip')}
                      aria-invalid={invalid('zip')}
                    />
                  </div>
                  <Err msg={errs.zip} />
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <div className="field__head"><label htmlFor="country">Country</label></div>
                  <div className="control control--icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3.2 9.5h17.6M3.2 14.5h17.6M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      autoComplete="country-name"
                      value={COUNTRY.label}
                      readOnly
                      aria-readonly="true"
                    />
                  </div>
                  <p className="hint">We deliver to all governorates across Tunisia.</p>
                </div>
                <div className={fieldCls('phone')}>
                  <div className="field__head"><label htmlFor="phone">Phone number</label></div>
                  <div className="phone">
                    <span className="phone__cc">
                      <i>{COUNTRY.flag}</i>
                      <span>+{COUNTRY.dd}</span>
                    </span>
                    <div className="control">
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        placeholder="27 123 456"
                        value={f.phone}
                        onChange={set('phone')}
                        aria-invalid={invalid('phone')}
                      />
                    </div>
                  </div>
                  <Err msg={errs.phone} />
                  <p className="hint">The courier calls before arriving — 8 digits.</p>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel__head">
                <span className="panel__n">2</span>
                <h2>Shipping option</h2>
              </div>

              {shippingLoading ? (
                <p style={{ color: 'var(--sub, #666)', padding: '12px 0' }}>
                  Loading shipping options…
                </p>
              ) : shippingError ? (
                <div className="codbox codbox--warn" style={{ marginBottom: 12 }}>
                  <Warn size={15} />
                  <span>{shippingError}</span>
                </div>
              ) : (
                <div className="opts">
                  {shippingOptions.map((opt) => {
                    const isChecked = selectedShippingId === opt.id;
                    const cost = opt.amount ?? opt.calculated_price?.calculated_amount ?? 0;
                    const priceDisplay =
                      cost === 0 ? 'Free' : formatPrice(cost, t.currencyCode);

                    return (
                      <label
                        className="optcard"
                        key={opt.id}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          name="ship"
                          value={opt.id}
                          checked={isChecked}
                          onChange={() => handleShippingSelect(opt.id)}
                        />
                        <span className="optcard__ui">
                          <span className="optcard__dot" />
                          <span>
                            <span className="optcard__label">{opt.name}</span>
                            {opt.type?.description ? (
                              <span className="optcard__eta">{opt.type.description}</span>
                            ) : null}
                          </span>
                          <span className="optcard__price">{priceDisplay}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="hint">Delivery runs Sunday to Friday across Tunisia.</p>
            </section>

            <section className="panel">
              <div className="panel__head">
                <span className="panel__n">3</span>
                <h2>Payment &amp; order placement</h2>
              </div>
              <div className="paylist">
                <label className="pay">
                  <input type="radio" name="pay" value="cod" checked readOnly />
                  <span className="pay__ui">
                    <span className="optcard__dot" />
                    <span>
                      <span className="pay__label">Cash on delivery</span>
                      <span className="pay__desc">
                        Pay the courier in cash when your order arrives. Please have the exact amount ready.
                      </span>
                    </span>
                    <span className="pay__ico">
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.5h19v10h-19z" /><circle cx="12" cy="12.5" r="2.6" /><path d="M5.5 10.5h.01M18.5 14.5h.01" /></svg>
                    </span>
                  </span>
                </label>
              </div>

              {emptyCart ? (
                <div className="codbox codbox--warn">
                  <Warn size={15} />
                  <span>
                    <b>Your cart is empty.</b> <Link href="/cart" style={{ fontWeight: 600, textDecoration: 'underline' }}>Add a pair</Link> before placing an order.
                  </span>
                </div>
              ) : (
                <div className="codbox">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16.5v-5m0-3.2v-.3" /></svg>
                  <span>
                    Have <b>{formatPrice(t.total, t.currencyCode)}</b> ready in cash. The courier carries no change above TND 20 — please keep notes and coins handy.
                  </span>
                </div>
              )}

              <div className={fieldCls('agree')} style={{ marginTop: 22 }}>
                <label className="opt">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={!!f.agree}
                    onChange={(e) => {
                      const next = { ...f, agree: e.target.checked };
                      setF(next);
                      if (errs.agree) validate(next, 'agree');
                    }}
                  />
                  <span className="opt__box">
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4.5 4.5L19 7" /></svg>
                  </span>
                  <span>
                    I confirm my address is correct and accept the <Link href="/pages/terms">terms of sale</Link> and <Link href="/pages/returns">return policy</Link>.
                  </span>
                </label>
                <Err msg={errs.agree} />
              </div>

              <div
                className={'notice' + (bar ? ' notice--' + bar.kind : '')}
                role="status"
                aria-live="polite"
                {...(bar ? { 'data-show': '' } : {})}
              >
                {bar ? <span>{bar.html}</span> : null}
              </div>

              <button
                className="btn btn--dark btn--block"
                type="submit"
                disabled={count === 0 || busy || !!shippingError || orderPlaced}
                data-busy="Placing order…"
              >
                {busy ? (
                  <><span className="btn__spin" />Placing order…</>
                ) : (
                  'Place order · ' + formatPrice(t.total, t.currencyCode)
                )}
              </button>
            </section>
          </form>

          <aside className="ck__summary">
            <div className="sumcard">
              <h2>Order summary</h2>
              <div className="sumitems">
                {lines.map((l) => (
                  <div className="sline" key={l.id || l.variantId || l.i}>
                    <div className="sline__media">
                      <img src={l.img || '/images/hero-shoe.png'} alt={l.name || ''} />
                      <span className="sline__n">{l.qty}</span>
                    </div>
                    <div>
                      <p className="sline__name">{l.name}</p>
                      {cleanVariantTitle(l.variantTitle) ? (
                        <p className="sline__meta">{cleanVariantTitle(l.variantTitle)}</p>
                      ) : l.sub ? (
                        <p className="sline__meta">{l.sub}</p>
                      ) : null}
                    </div>
                    <p className="sline__price">{formatPrice(l.line, t.currencyCode)}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="sumrow">
                  <span>Subtotal <em>({n} {n === 1 ? 'item' : 'items'})</em></span>
                  <b>{formatPrice(t.subtotal, t.currencyCode)}</b>
                </div>
                <div className="sumrow">
                  <span>Delivery</span>
                  <b>{t.shipping === 0 ? 'Free' : formatPrice(t.shipping, t.currencyCode)}</b>
                </div>
                {t.tax > 0 && (
                  <div className="sumrow">
                    <span>VAT / Tax</span>
                    <b>{formatPrice(t.tax, t.currencyCode)}</b>
                  </div>
                )}
                <div className="sumrow sumrow--total">
                  <span>Total due on delivery</span>
                  <b>{formatPrice(t.total, t.currencyCode)}</b>
                </div>
              </div>
              <div className="ck__payline">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="6" width="19" height="13" rx="2" /><path d="M2.5 10h19" /><circle cx="17" cy="14.5" r="1" /></svg>
                <span>Paying with <b>Cash on delivery</b></span>
              </div>
              <p className="ck__legal">
                Placing this order creates a reservation. Nothing is charged online; you hand the amount to the courier when your parcel is delivered.
              </p>
            </div>
            <div style={{ marginTop: 14 }}>
              <Link className="btn btn--ghost" href="/cart">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
                Edit cart
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
