'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import AuthPanel from '@/components/AuthPanel';
import Notice from '@/components/Notice';
import { EMAIL_RE } from '@/lib/auth';

const MAIL = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6.5 9 6 9-6" /></svg>;

const ErrIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5m0 3.2v.3" /></svg>
);

export default function ForgotForm() {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [bar, setBar] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [sent, setSent] = useState(false);
  const [left, setLeft] = useState(30);
  const timer = useRef(null);
  const inputRef = useRef(null);

  function countdown() {
    clearInterval(timer.current);
    setLeft(30);
    timer.current = setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          clearInterval(timer.current);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  }

  useEffect(() => () => clearInterval(timer.current), []);

  const check = (v) => (!v.trim() ? 'Email is required.' : (!EMAIL_RE.test(v) ? 'Enter a valid email address.' : ''));

  const type = (e) => {
    setEmail(e.target.value);
    setBar(null);
    if (err) setErr(check(e.target.value));
  };

  const submit = (e) => {
    e.preventDefault();
    setBar(null);
    const msg = check(email);
    setErr(msg);
    if (msg) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSentTo(email.trim());
      setSent(true);
      countdown();
    }, 650);
  };

  const resend = () => {
    setBar({ kind: 'ok', html: 'We’ve sent the link again. It expires in 30 minutes.' });
    countdown();
  };

  const again = () => {
    setSent(false);
    clearInterval(timer.current);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <AuthPanel
      img="/images/tech-sole-close.png"
      quote="“Locked myself out again and the reset link landed in four seconds. No drama.”"
      byline="Marcus D. — verified NOVA customer"
      back="Back to sign in" backHref="/login"
      eyebrow="Account recovery" title="Reset your password"
      sub={<>Enter the email you signed up with and we’ll send a secure link to choose a new password. <Link href="/login">Back to sign in</Link></>}
    >
      <Notice bar={bar} />

      <form onSubmit={submit} noValidate hidden={sent}>
        <div className={'field' + (err ? ' field--error' : '')}>
          <div className="field__head"><label htmlFor="femail">Email address</label></div>
          <div className="control control--icon">
            {MAIL}
            <input id="femail" ref={inputRef} name="email" type="email" inputMode="email" autoComplete="email"
                   placeholder="you@example.com" value={email} onChange={type}
                   aria-invalid={err ? 'true' : undefined} />
          </div>
          <p className="err">{err ? <><ErrIcon /><span>{err}</span></> : undefined}</p>
        </div>

        <button className="btn btn--dark btn--block" type="submit" disabled={busy} data-busy="Sending link…">
          {busy ? <><span className="btn__spin" />Sending link…</> : 'Email me a reset link'}
        </button>
      </form>

      <div className="sent" hidden={!sent}>
        <div className="sent__icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6.5 9 6 9-6" /></svg>
        </div>
        <h2 className="sent__title">Check your inbox</h2>
        <p className="sent__body">If an account exists for <span className="email">{sentTo}</span>, a reset link is on its way. The link expires in 30 minutes and can be used once.</p>
        <p className="sent__hint">Nothing yet? Look in spam, or try the address you ordered with.</p>

        <div className="sent__actions">
          <p className="resend" hidden={left === 0}>You can request another link in <b>{left}</b>s.</p>
          <button className="btn btn--ghost btn--block" type="button" onClick={resend} hidden={left > 0}>Resend the link</button>
          <Link className="btn btn--dark btn--block" href="/login">Return to sign in</Link>
          <button className="linklike" type="button" onClick={again}>Use a different email</button>
        </div>
      </div>

      <p className="auth__legal">For your security we never confirm whether an email is registered. Every address gets the same message.</p>

      <div className="auth__foot">
        <span>Still stuck?</span>
        <Link href="/contact">Talk to customer care
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
      </div>
    </AuthPanel>
  );
}
