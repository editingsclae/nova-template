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

      <form className="auth__form" onSubmit={submit} noValidate>
        <div className={'field' + (errs.email ? ' field--err' : '')}>
          <label htmlFor="login-email">Email address</label>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden="true">{MAIL}</span>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={typeEmail}
              onBlur={() => setErrs((p) => ({ ...p, email: checkEmail() }))}
              placeholder="you@domain.com"
              autoComplete="email"
              autoFocus
              required
            />
          </div>
          {errs.email && <p className="err-hint"><ErrIcon /> {errs.email}</p>}
        </div>

        <div className={'field' + (errs.password ? ' field--err' : '')}>
          <div className="field-between">
            <label htmlFor="login-pass">Password</label>
            <Link className="field-link" href="/account/forgot-password">Forgot password?</Link>
          </div>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden="true">{LOCK}</span>
            <input
              ref={passRef}
              id="login-pass"
              type={show ? 'text' : 'password'}
              value={pass}
              onChange={typePass}
              onBlur={() => setErrs((p) => ({ ...p, password: checkPass() }))}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="input-eye"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? EYE_OFF : EYE}
            </button>
          </div>
          {errs.password && <p className="err-hint"><ErrIcon /> {errs.password}</p>}
        </div>

        <div className="field-split">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Remember email</span>
          </label>
        </div>

        <button
          className="btn btn--dark btn--block"
          type="submit"
          disabled={busy}
          data-busy="Signing in…"
        >
          {busy ? <><span className="btn__spin" />Signing in…</> : 'Sign in'}
        </button>
      </form>
    </AuthPanel>
  );
}
