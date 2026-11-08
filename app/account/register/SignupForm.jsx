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
const CHK = (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 13 4.5 4.5L19 7" />
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
const LI_TEXT = ['8+ characters', 'Upper & lowercase', 'At least one number', 'At least one symbol'];

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
  const touch = (k, msg) => setErrs((p) => (p[k] ? { ...p, [k]: msg() } : p));

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
      quote="Members get first access to drops, free returns for 30 days and early colourways."
      byline={`The ${STORE_NAME} club — free, always`}
      back="Continue shopping"
      backHref="/"
      eyebrow="Join us"
      title={`Create your ${STORE_NAME} account`}
      sub={
        <>
          Already a member? <Link href="/account/login">Sign in here</Link>.
        </>
      }
    >
      <Notice bar={bar} />

      <form onSubmit={submit} noValidate>
        <div className="row2">
          <div className={'field' + (errs.name ? ' field--error' : '')}>
            <div className="field__head"><label htmlFor="name">Full name</label></div>
            <div className="control control--icon">
              {USER}
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Avery Ben"
                value={name}
                aria-invalid={errs.name ? 'true' : undefined}
                onChange={(e) => {
                  setName(e.target.value);
                  setBar(null);
                  touch('name', () => (e.target.value.trim() ? '' : 'Please enter your name.'));
                }}
              />
            </div>
            <Err msg={errs.name} />
          </div>

          <div className={'field' + (errs.email ? ' field--error' : '')}>
            <div className="field__head"><label htmlFor="email">Email</label></div>
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
                aria-invalid={errs.email ? 'true' : undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setBar(null);
                  touch('email', () => (!e.target.value.trim() ? 'Email is required.' : (!EMAIL_RE.test(e.target.value) ? 'Enter a valid email address.' : '')));
                }}
              />
            </div>
            <Err msg={errs.email} />
          </div>
        </div>

        <div className={'field' + (errs.password ? ' field--error' : '')}>
          <div className="field__head"><label htmlFor="password">Password</label></div>
          <div className="control control--icon">
            {LOCK}
            <input
              id="password"
              name="password"
              type={show ? 'text' : 'password'}
              className="has-toggle"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={pass}
              aria-describedby="strengthMeta"
              aria-invalid={errs.password ? 'true' : undefined}
              onChange={(e) => {
                setPass(e.target.value);
                setBar(null);
                touch('password', () => (!e.target.value ? 'Password is required.' : (e.target.value.length < 8 ? 'Use at least 8 characters.' : '')));
              }}
            />
            <button
              className="pw-toggle"
              type="button"
              aria-label={show ? 'Hide password' : 'Show password'}
              onClick={() => setShow(!show)}
            >
              {show ? EYE_OFF : EYE}
            </button>
          </div>
          <Err msg={errs.password} />

          <div className="strength" id="strengthMeta" data-score={s}>
            <div className="strength__bars"><i /><i /><i /><i /></div>
            <div className="strength__meta"><span>Password strength</span><b>{LABELS[s]}</b></div>
            <ul className="strength__rules">
              {LI_TEXT.map((t, i) => (
                <li className={pass && RULES[i].ok(pass) ? 'met' : ''} key={t} data-rule={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className={'field' + (errs.confirm ? ' field--error' : '')}>
          <div className="field__head"><label htmlFor="confirm">Confirm password</label></div>
          <div className="control control--icon">
            {LOCK}
            <input
              id="confirm"
              name="confirm"
              type={showConfirm ? 'text' : 'password'}
              className="has-toggle"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirm}
              aria-invalid={errs.confirm ? 'true' : undefined}
              onChange={(e) => {
                setConfirm(e.target.value);
                setBar(null);
                touch('confirm', () => (!e.target.value ? 'Re-enter your password.' : (e.target.value !== pass ? 'Passwords don’t match.' : '')));
              }}
            />
            <button
              className="pw-toggle"
              type="button"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? EYE_OFF : EYE}
            </button>
          </div>
          <Err msg={errs.confirm} />
        </div>

        <div className={'field' + (errs.terms ? ' field--error' : '')}>
          <label className="opt">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked);
                setBar(null);
                if (errs.terms) setErrs((p) => ({ ...p, terms: e.target.checked ? '' : 'Please accept the terms to continue.' }));
              }}
            />
            <span className="opt__box">{CHK}</span>
            <span>I agree to the <Link href="/pages/terms">Terms of Service</Link> and <Link href="/pages/privacy">Privacy Policy</Link>.</span>
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

      <p className="auth__legal">By creating an account you agree that {STORE_NAME} may store your order history and size preferences to speed up checkout.</p>

      <div className="auth__foot">
        <span>Prefer to browse first?</span>
        <Link href="/shop">
          Open the shop
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </AuthPanel>
  );
}
