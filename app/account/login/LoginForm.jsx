'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPanel from '@/components/AuthPanel';
import Notice from '@/components/Notice';
import { EYE, EYE_OFF } from '@/components/PwEye';
import {
  loginCustomer,
  setCartCustomer,
  getEmailVerification,
  claimOrders,
  STORE_NAME,
} from '@/lib/medusa';

const MAIL = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m3 6.5 9 6 9-6" />
  </svg>
);
const LOCK = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
  </svg>
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const REMEMBER_KEY = 'nova.remembered';

const emailMsg = (v) => (!v.trim() ? 'Email is required.' : (!EMAIL_RE.test(v) ? 'Enter a valid email address.' : ''));
const passMsg = (v) => (!v ? 'Password is required.' : (v.length < 8 ? 'Use at least 8 characters.' : ''));

const ErrIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5m0 3.2v.3" />
  </svg>
);

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [errs, setErrs] = useState({});
  const [bar, setBar] = useState(null);
  const [busy, setBusy] = useState(false);
  const passRef = useRef(null);

  useEffect(() => {
    // Rule 11: Expire legacy cookie if present
    try {
      document.cookie = 'medusa_customer_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e) {}

    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch (e) {}
  }, []);

  const checkEmail = () => emailMsg(email);
  const checkPass = () => passMsg(pass);

  const typeEmail = (e) => {
    setEmail(e.target.value);
    setBar(null);
    setErrs((p) => (p.email ? { ...p, email: emailMsg(e.target.value) } : p));
  };
  const typePass = (e) => {
    setPass(e.target.value);
    setBar(null);
    setErrs((p) => (p.password ? { ...p, password: passMsg(e.target.value) } : p));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBar(null);
    const next = { email: checkEmail(), password: checkPass() };
    setErrs(next);
    if (next.email || next.password) return;

    setBusy(true);

    try {
      const { token, customer } = await loginCustomer({
        email: email.trim(),
        password: pass,
      });

      if (!token) throw new Error('Login failed');

      // Rule 11: Token in localStorage only
      localStorage.setItem('medusa_token', token);

      if (remember) {
        try {
          localStorage.setItem(REMEMBER_KEY, email.trim());
        } catch (e) {}
      } else {
        try {
          localStorage.removeItem(REMEMBER_KEY);
        } catch (e) {}
      }

      // Rule 13: Associate existing guest cart with logged in customer
      try {
        const cartId = localStorage.getItem('medusa_cart_id');
        if (cartId) {
          await setCartCustomer(cartId, token);
        }
      } catch (err) {
        console.warn('[login] setCartCustomer error:', err);
      }

      // Rule 18: If email is already confirmed, claim orders
      try {
        const vInfo = await getEmailVerification(token);
        if (vInfo?.verified) {
          await claimOrders(token);
        }
      } catch (err) {
        /* Ignore verification / claim-orders failure so login still works */
      }

      const firstName = customer?.first_name || '';
      setBar({
        kind: 'ok',
        html: `Welcome back${firstName ? ', ' + firstName : ''}. Taking you to your account…`,
      });

      setTimeout(() => router.push('/account'), 800);
    } catch (err) {
      console.error('[login] Error:', err);
      setBar({
        kind: 'err',
        html: 'That email and password combination doesn’t match an account.',
      });
      setPass('');
      setErrs((p) => ({ ...p, password: '' }));
      passRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthPanel
      img="/images/hero-shoe.png"
      quote="“The pair I've worn every single day for eight months. Still looks new.”"
      byline={`Priya R. — verified ${STORE_NAME} customer`}
      back="Continue shopping"
      backHref="/"
      eyebrow="Members"
      title={`Sign in to ${STORE_NAME}`}
      sub={
        <>
          New to the club? <Link href="/account/register">Create an account</Link> — it takes 30 seconds.
        </>
      }
    >
      <Notice bar={bar} />

      <form onSubmit={submit} noValidate>
        <div className={'field' + (errs.email ? ' field--error' : '')}>
          <div className="field__head"><label htmlFor="email">Email address</label></div>
          <div className="control control--icon">
            {MAIL}
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={typeEmail}
              aria-invalid={errs.email ? 'true' : undefined}
            />
          </div>
          <p className="err">{errs.email ? <><ErrIcon /><span>{errs.email}</span></> : null}</p>
        </div>

        <div className={'field' + (errs.password ? ' field--error' : '')}>
          <div className="field__head">
            <label htmlFor="password">Password</label>
            <Link className="field__link" href="/account/forgot-password">Forgot password?</Link>
          </div>
          <div className="control control--icon">
            {LOCK}
            <input
              id="password"
              name="password"
              type={show ? 'text' : 'password'}
              className="has-toggle"
              autoComplete="current-password"
              placeholder="Enter your password"
              ref={passRef}
              value={pass}
              onChange={typePass}
              aria-invalid={errs.password ? 'true' : undefined}
            />
            <button
              className="pw-toggle"
              type="button"
              aria-label={show ? 'Hide password' : 'Show password'}
              onClick={() => {
                setShow(!show);
                passRef.current?.focus();
              }}
            >
              {show ? EYE_OFF : EYE}
            </button>
          </div>
          <p className="err">{errs.password ? <><ErrIcon /><span>{errs.password}</span></> : null}</p>
        </div>

        <label className="opt" style={{ margin: '2px 0 22px' }}>
          <input
            type="checkbox"
            id="remember"
            name="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span className="opt__box">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4.5 4.5L19 7" />
            </svg>
          </span>
          <span>Keep me signed in on this device</span>
        </label>

        <button
          className="btn btn--dark btn--block"
          type="submit"
          disabled={busy}
          data-busy="Signing in…"
        >
          {busy ? <><span className="btn__spin" />Signing in…</> : 'Sign in'}
        </button>
      </form>

      <div className="auth__foot">
        <span>Need a hand?</span>
        <Link href="/shop">
          Browse the shop
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </AuthPanel>
  );
}
