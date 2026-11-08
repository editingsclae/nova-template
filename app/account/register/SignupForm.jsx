'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPanel from '@/components/AuthPanel';
import Notice from '@/components/Notice';
import { EYE, EYE_OFF } from '@/components/PwEye';
import { EMAIL_RE, loadAccounts, saveAccounts, writeSession } from '@/lib/auth';
import { STORE_NAME } from '@/lib/medusa';

const USER = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>;
const MAIL = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6.5 9 6 9-6" /></svg>;
const LOCK = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10.5" width="16" height="10.5" rx="2.5" /><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /></svg>;
const CHK = <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4.5 4.5L19 7" /></svg>;

const RULES = [
  { t: '8+ characters', ok: (v) => v.length >= 8 },
  { t: 'Upper & lower', ok: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { t: 'A number', ok: (v) => /\d/.test(v) },
  { t: 'A symbol', ok: (v) => /[^A-Za-z0-9]/.test(v) }
];
const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const LI_TEXT = ['8+ characters', 'Upper & lowercase', 'At least one number', 'At least one symbol'];

function score(v) {
  if (!v) return 0;
  const s = RULES.filter((r) => r.ok(v)).length;
  return v.length < 8 ? Math.min(s, 2) : s;
}

const ErrIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5m0 3.2v.3" /></svg>
);
const Err = ({ msg }) => msg ? <p className="err"><ErrIcon /><span>{msg}</span></p> : <p className="err" />;

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(true);
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errs, setErrs] = useState({});
  const [bar, setBar] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loadAccounts().length) {
      saveAccounts([{ name: 'Avery Nova', email: 'hello@nova.store', password: 'Nova1234' }]);
    }
  }, []);

  const s = score(pass);
  const touch = (k, msg) => setErrs((p) => (p[k] ? { ...p, [k]: msg() } : p));

  const submit = (e) => {
    e.preventDefault();
    setBar(null);
    const next = {
      name: name.trim() ? '' : 'Please enter your name.',
      email: !email.trim() ? 'Email is required.' : (!EMAIL_RE.test(email) ? 'Enter a valid email address.' : ''),
      password: !pass ? 'Password is required.' : (pass.length < 8 ? 'Use at least 8 characters.' : ''),
      confirm: !confirm ? 'Re-enter your password.' : (confirm !== pass ? 'Passwords don’t match.' : ''),
      terms: terms ? '' : 'Please accept the terms to continue.'
    };
    setErrs(next);
    if (Object.values(next).some(Boolean)) return;

    const taken = loadAccounts().filter((a) => a.email === email.trim().toLowerCase())[0];
    if (taken) {
      setErrs({ ...next, email: 'An account with this email already exists.' });
      setBar({
        kind: 'err',
        html: (
          <>
            You already have an account with this email.{' '}
            <Link href="/account/login" style={{ fontWeight: 600, textDecoration: 'underline' }}>
              Log in instead
            </Link>
          </>
        )
      });
      return;
    }

    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      const list = loadAccounts();
      const acct = { name: name.trim(), email: email.trim().toLowerCase(), password: pass, created: Date.now() };
      list.push(acct);
      saveAccounts(list);
      writeSession(acct);
      setBar({ kind: 'ok', html: 'Account created. Signing you in…' });
      setTimeout(() => router.push('/account'), 1100);
    }, 700);
  };

  return (
    <AuthPanel
      img="/images/banner-men.png"
      quote="Members get first access to drops, free returns for 30 days and early colourways."
      byline={`The ${STORE_NAME} club — free, always`}
      back="Continue shopping" backHref="/"
      eyebrow="Join us" title="Create your account"
      sub={<>Already have an account? <Link href="/account/login">Sign in</Link></>}
    >
      <Notice bar={bar} />

      <form className="auth__form" onSubmit={submit} noValidate>
        <div className={'field' + (errs.name ? ' field--err' : '')}>
          <label htmlFor="reg-name">Full name</label>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden="true">{USER}</span>
            <input id="reg-name" type="text" value={name} onChange={(e) => { setName(e.target.value); touch('name', () => (e.target.value.trim() ? '' : 'Please enter your name.')); }}
              placeholder="e.g. Avery Smith" autoComplete="name" autoFocus required />
          </div>
          <Err msg={errs.name} />
        </div>

        <div className={'field' + (errs.email ? ' field--err' : '')}>
          <label htmlFor="reg-email">Email address</label>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden="true">{MAIL}</span>
            <input id="reg-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); touch('email', () => (!e.target.value.trim() ? 'Email is required.' : (!EMAIL_RE.test(e.target.value) ? 'Enter a valid email address.' : ''))); }}
              placeholder="you@domain.com" autoComplete="email" required />
          </div>
          <Err msg={errs.email} />
        </div>

        <div className={'field' + (errs.password ? ' field--err' : '')}>
          <label htmlFor="reg-pass">Create password</label>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden="true">{LOCK}</span>
            <input id="reg-pass" type={show ? 'text' : 'password'} value={pass}
              onChange={(e) => { setPass(e.target.value); touch('password', () => (!e.target.value ? 'Password is required.' : (e.target.value.length < 8 ? 'Use at least 8 characters.' : ''))); }}
              placeholder="At least 8 characters" autoComplete="new-password" required />
            <button className="eye-btn" type="button" onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? EYE_OFF : EYE}
            </button>
          </div>
          <Err msg={errs.password} />
        </div>

        {pass && (
          <div className="meter" aria-live="polite">
            <div className="meter__top">
              <span>Password strength</span>
              <span className={'meter__score meter__score--' + s}>{LABELS[s]}</span>
            </div>
            <div className="meter__bars" data-score={s}>
              <span /><span /><span /><span />
            </div>
            <ul className="meter__rules">
              {RULES.map((r, i) => (
                <li key={r.t} className={r.ok(pass) ? 'is-ok' : ''}>
                  <span className="chk">{r.ok(pass) ? CHK : null}</span>
                  {LI_TEXT[i]}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={'field' + (errs.confirm ? ' field--err' : '')}>
          <label htmlFor="reg-confirm">Confirm password</label>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden="true">{LOCK}</span>
            <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} value={confirm}
              onChange={(e) => { setConfirm(e.target.value); touch('confirm', () => (!e.target.value ? 'Re-enter your password.' : (e.target.value !== pass ? 'Passwords don’t match.' : ''))); }}
              placeholder="Repeat your password" autoComplete="new-password" required />
            <button className="eye-btn" type="button" onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}>
              {showConfirm ? EYE_OFF : EYE}
            </button>
          </div>
          <Err msg={errs.confirm} />
        </div>

        <div className="auth__opts">
          <label className={'checkbox' + (errs.terms ? ' checkbox--err' : '')}>
            <input type="checkbox" checked={terms} onChange={(e) => { setTerms(e.target.checked); if (e.target.checked) setErrs((p) => ({ ...p, terms: '' })); }} />
            <span className="checkbox__box" />
            <span className="checkbox__lbl">
              I agree to the <Link href="/pages/terms" target="_blank">Terms of Service</Link> and <Link href="/pages/privacy" target="_blank">Privacy Policy</Link>
            </span>
          </label>
          <Err msg={errs.terms} />

          <label className="checkbox">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            <span className="checkbox__box" />
            <span className="checkbox__lbl">Keep me posted about new releases and member-only drops</span>
          </label>
        </div>

        <button className="btn btn--dark btn--block" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </AuthPanel>
  );
}
