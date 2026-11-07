'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPanel from '@/components/AuthPanel';
import Notice from '@/components/Notice';
import { EYE, EYE_OFF } from '@/components/PwEye';
import { EMAIL_RE, REMEMBER, ensureSeed, findAccount, writeSession } from '@/lib/auth';

const MAIL = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6.5 9 6 9-6" /></svg>;
const LOCK = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10.5" width="16" height="10.5" rx="2.5" /><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /></svg>;

const emailMsg = (v) => (!v.trim() ? 'Email is required.' : (!EMAIL_RE.test(v) ? 'Enter a valid email address.' : ''));
const passMsg = (v) => (!v ? 'Password is required.' : (v.length < 8 ? 'Use at least 8 characters.' : ''));

const ErrIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5m0 3.2v.3" /></svg>
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
    ensureSeed();
    try {
      const saved = localStorage.getItem(REMEMBER);
      if (saved) { setEmail(saved); setRemember(true); }
    } catch (e) { /* ignore */ }
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

  const submit = (e) => {
    e.preventDefault();
    setBar(null);
    const next = { email: checkEmail(), password: checkPass() };
    setErrs(next);
    if (next.email || next.password) return;

    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      const acct = findAccount(email);
      if (!acct || acct.password !== pass) {
        // one generic message so the form can't be used to enumerate accounts
        setBar({ kind: 'err', html: 'That email and password combination doesn’t match an account.' });
        setPass('');
        setErrs((p) => ({ ...p, password: '' }));
        passRef.current?.focus();
        try { localStorage.removeItem(REMEMBER); } catch (err) { /* ignore */ }
        return;
      }
      try {
        if (remember) localStorage.setItem(REMEMBER, acct.email);
        else localStorage.removeItem(REMEMBER);
      } catch (err) { /* ignore */ }
      writeSession(acct);
      setBar({ kind: 'ok', html: 'Welcome back, ' + acct.name.split(' ')[0] + '. Taking you to your account…' });
      setTimeout(() => router.push('/account'), 1100);
    }, 650);
  };

  const social = (name) => (e) => {
    setBar({ kind: 'err', html: name + ' sign-in isn’t connected in this demo — use the email form below.' });
    e.currentTarget.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <AuthPanel
      img="/images/hero-shoe.png"
      quote="“The pair I've worn every single day for eight months. Still looks new.”"
      byline="Priya R. — verified NOVA customer"
      back="Continue shopping" backHref="/"
      eyebrow="Members" title="Sign in to NOVA"
      sub={<>New to the club? <Link href="/signup">Create an account</Link> — it takes 30 seconds.</>}
    >
      <Notice bar={bar} />

      <div className="social">
        <button className="btn btn--social" type="button" onClick={social('Google')}>
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z" /><path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1a6.9 6.9 0 0 1-6.5-4.7H1.7v3A12 12 0 0 0 12 24Z" /><path fill="#FBBC05" d="M5.5 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.7a12 12 0 0 0 0 10.7l3.8-3Z" /><path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.7 11.7 0 0 0 12 0 12 12 0 0 0 1.7 6.1l3.8 3A6.9 6.9 0 0 1 12 4.8Z" /></svg>
          Google
        </button>
        <button className="btn btn--social" type="button" onClick={social('Apple')}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#1b1a18"><path d="M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9s-2.1-.9-3.4-.9c-1.8 0-3.4 1-4.3 2.6-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.2 2.6 1.3 0 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.5a11 11 0 0 0 1.4-2.8c-.1 0-2.6-1-2.7-4.5ZM14 4.8c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.2 1.1.1 2.3-.6 3-1.5Z" /></svg>
          Apple
        </button>
      </div>

      <div className="divider">or with email</div>

      <form onSubmit={submit} noValidate>
        <div className={'field' + (errs.email ? ' field--error' : '')}>
          <div className="field__head"><label htmlFor="email">Email address</label></div>
          <div className="control control--icon">
            {MAIL}
            <input id="email" name="email" type="email" inputMode="email" autoComplete="email"
                   placeholder="you@example.com" value={email} onChange={typeEmail}
                   aria-invalid={errs.email ? 'true' : undefined} />
          </div>
          <p className="err">{errs.email ? <ErrIcon /> : null}{errs.email ? <span>{errs.email}</span> : null}</p>
        </div>

        <div className={'field' + (errs.password ? ' field--error' : '')}>
          <div className="field__head">
            <label htmlFor="password">Password</label>
            <Link className="field__link" href="/forgot-password">Forgot password?</Link>
          </div>
          <div className="control control--icon">
            {LOCK}
            <input id="password" name="password" type={show ? 'text' : 'password'} className="has-toggle"
                   autoComplete="current-password" placeholder="Enter your password" ref={passRef}
                   value={pass} onChange={typePass} aria-invalid={errs.password ? 'true' : undefined} />
            <button className="pw-toggle" type="button" aria-label={show ? 'Hide password' : 'Show password'}
                    onClick={() => { setShow(!show); passRef.current?.focus(); }}>
              {show ? EYE_OFF : EYE}
            </button>
          </div>
          <p className="err">{errs.password ? <><ErrIcon /><span>{errs.password}</span></> : null}</p>
        </div>

        <label className="opt" style={{ margin: '2px 0 22px' }}>
          <input type="checkbox" id="remember" name="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span className="opt__box"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4.5 4.5L19 7" /></svg></span>
          <span>Keep me signed in on this device</span>
        </label>

        <button className="btn btn--dark btn--block" type="submit" disabled={busy} data-busy="Signing in…">
          {busy ? <><span className="btn__spin" />Signing in…</> : 'Sign in'}
        </button>
      </form>

      <p className="demo-note"><b>Demo account</b><br />hello@nova.store · Nova1234</p>

      <div className="auth__foot">
        <span>Need a hand?</span>
        <Link href="/shop">Browse the shop
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
      </div>
    </AuthPanel>
  );
}
