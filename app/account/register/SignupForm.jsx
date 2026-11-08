'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPanel from '@/components/AuthPanel';
import Notice from '@/components/Notice';
import { EYE, EYE_OFF } from '@/components/PwEye';
import {
  registerCustomer,
  setCartCustomer,
  STORE_NAME,
} from '@/lib/medusa';

const USER = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);
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

const RULES = [
  { t: '8+ characters', ok: (v) => v.length >= 8 },
  { t: 'Upper & lower', ok: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { t: 'A number', ok: (v) => /\d/.test(v) },
  { t: 'A symbol', ok: (v) => /[^A-Za-z0-9]/.test(v) },
];
const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

function score(v) {
  if (!v) return 0;
  const s = RULES.filter((r) => r.ok(v)).length;
  return v.length < 8 ? Math.min(s, 2) : s;
}

const ErrIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5m0 3.2v.3" />
  </svg>
);
const Err = ({ msg }) => (msg ? <p className="err"><ErrIcon /><span>{msg}</span></p> : <p className="err" />);

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errs, setErrs] = useState({});
  const [bar, setBar] = useState(null);
  const [busy, setBusy] = useState(false);

  const s = score(pass);

  const submit = async (e) => {
    e.preventDefault();
    setBar(null);

    const next = {
      name: name.trim() ? '' : 'Please enter your name.',
      email: !email.trim() ? 'Email is required.' : (!EMAIL_RE.test(email) ? 'Enter a valid email address.' : ''),
      password: !pass ? 'Password is required.' : (pass.length < 8 ? 'Use at least 8 characters.' : ''),
      confirm: !confirm ? 'Re-enter your password.' : (confirm !== pass ? 'Passwords don’t match.' : ''),
      terms: terms ? '' : 'Please accept the terms to continue.',
    };

    setErrs(next);
    if (Object.values(next).some(Boolean)) return;

    setBusy(true);

    try {
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] || 'Customer';
      const lastName = parts.slice(1).join(' ') || firstName;

      // Rule 10: Three-call registration
      const { token } = await registerCustomer({
        email: email.trim().toLowerCase(),
        password: pass,
        firstName,
        lastName,
      });

      if (!token) throw new Error('Registration failed');

      // Rule 11: Store token in localStorage only
      localStorage.setItem('medusa_token', token);

      // Rule 13: Associate guest cart
      try {
        const cartId = localStorage.getItem('medusa_cart_id');
        if (cartId) {
          await setCartCustomer(cartId, token);
        }
      } catch (err) {}

      setBar({
        kind: 'ok',
        html: 'Account created! Taking you to your account…',
      });

      setTimeout(() => router.push('/account'), 800);
    } catch (err) {
      console.error('[signup] Registration error:', err);
      const msg = err?.data?.message || err?.message || '';

      // Rule 12: Email already exists
      if (
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('duplicate') ||
        err?.status === 422 ||
        err?.status === 409
      ) {
        setErrs((p) => ({ ...p, email: 'An account with this email already exists.' }));
        setBar({
          kind: 'err',
          html: (
            <>
              You already have an account with this email.{' '}
              <Link href="/account/login" style={{ fontWeight: 600, textDecoration: 'underline' }}>
                Log in instead.
              </Link>
            </>
          ),
        });
      } else {
        setBar({
          kind: 'err',
          html: msg || 'Failed to create account. Please check your information and try again.',
        });
      }
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
      title={`Create your ${STORE_NAME} account`}
      sub={
        <>
          Already a member? <Link href="/account/login">Sign in here</Link>.
        </>
      }
    >
      <Notice bar={bar} />

      <form className="auth__form" onSubmit={submit} noValidate>
        <div className={'field' + (errs.name ? ' field--err' : '')}>
          <label htmlFor="reg-name">Full name</label>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden="true">{USER}</span>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setBar(null);
                setErrs((p) => (p.name ? { ...p, name: e.target.value.trim() ? '' : 'Please enter your name.' } : p));
              }}
              placeholder="Avery Ben"
              autoComplete="name"
              autoFocus
              required
            />
          </div>
          <Err msg={errs.name} />
        </div>

        <div className={'field' + (errs.email ? ' field--err' : '')}>
          <label htmlFor="reg-email">Email address</label>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden="true">{MAIL}</span>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setBar(null);
              }}
              placeholder="you@domain.com"
              autoComplete="email"
              required
            />
          </div>
          <Err msg={errs.email} />
        </div>

        <div className={'field' + (errs.password ? ' field--err' : '')}>
          <label htmlFor="reg-pass">Password</label>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden="true">{LOCK}</span>
            <input
              id="reg-pass"
              type={show ? 'text' : 'password'}
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                setBar(null);
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="input-eye"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? EYE_OFF : EYE}
            </button>
          </div>
          <Err msg={errs.password} />

          {pass && (
            <div className="meter" aria-live="polite">
              <div className="meter__bars">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={'meter__bar' + (i < s ? ' meter__bar--on' : '')}
                    data-score={s}
                  />
                ))}
              </div>
              <span className="meter__label">{LABELS[s]}</span>
            </div>
          )}
        </div>

        <div className={'field' + (errs.confirm ? ' field--err' : '')}>
          <label htmlFor="reg-confirm">Confirm password</label>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden="true">{LOCK}</span>
            <input
              id="reg-confirm"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setBar(null);
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="input-eye"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? EYE_OFF : EYE}
            </button>
          </div>
          <Err msg={errs.confirm} />
        </div>

        <div className={'field field-split' + (errs.terms ? ' field--err' : '')}>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked);
                setBar(null);
                setErrs((p) => ({ ...p, terms: '' }));
              }}
            />
            <span>
              I accept the <Link href="/pages/terms" target="_blank">terms of service</Link> and <Link href="/pages/privacy" target="_blank">privacy policy</Link>.
            </span>
          </label>
          <Err msg={errs.terms} />
        </div>

        <button
          className="btn btn--dark btn--block"
          type="submit"
          disabled={busy}
          data-busy="Creating account…"
        >
          {busy ? <><span className="btn__spin" />Creating account…</> : 'Create account'}
        </button>
      </form>
    </AuthPanel>
  );
}
