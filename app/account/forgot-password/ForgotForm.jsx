'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPanel from '@/components/AuthPanel';
import Notice from '@/components/Notice';
import { EYE, EYE_OFF } from '@/components/PwEye';
import {
  requestPasswordReset,
  confirmPasswordReset,
  loginCustomer,
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
const KEY = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="15" r="4" />
    <path d="m10.8 12.2 8.2-8.2m-3 3 2 2m-4-1 2 2" />
  </svg>
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const ErrIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5m0 3.2v.3" />
  </svg>
);

export default function ForgotForm() {
  const router = useRouter();

  // Step 1: email, Step 2: code + new passwords
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [err, setErr] = useState('');
  const [codeErr, setCodeErr] = useState('');
  const [passErr, setPassErr] = useState('');
  const [confirmErr, setConfirmErr] = useState('');

  const [bar, setBar] = useState(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(60);

  const timer = useRef(null);
  const inputRef = useRef(null);

  function startCountdown(sec = 60) {
    clearInterval(timer.current);
    setLeft(sec);
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

  const typeEmail = (e) => {
    setEmail(e.target.value);
    setBar(null);
    if (err) setErr(check(e.target.value));
  };

  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    setBar(null);
    setErr('');

    const trimmed = email.trim();
    const msg = check(trimmed);
    if (msg) {
      setErr(msg);
      return;
    }

    setBusy(true);
    try {
      const res = await requestPasswordReset(trimmed);
      setSentTo(trimmed);
      setStep(2);
      startCountdown(res?.can_resend_in || 60);
    } catch (error) {
      // Always show standard view even on error per rule 29
      setSentTo(trimmed);
      setStep(2);
      startCountdown(60);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setBar(null);
    setCodeErr('');
    setPassErr('');
    setConfirmErr('');

    const trimmedCode = code.replace(/\D/g, '');
    let hasErr = false;

    if (!trimmedCode || trimmedCode.length !== 6) {
      setCodeErr('Enter the 6-digit verification code.');
      hasErr = true;
    }

    if (!password || password.length < 8) {
      setPassErr('Password must be at least 8 characters.');
      hasErr = true;
    }

    if (password !== confirmPassword) {
      setConfirmErr('Passwords do not match.');
      hasErr = true;
    }

    if (hasErr) return;

    setBusy(true);
    try {
      const resetRes = await confirmPasswordReset({
        email: sentTo || email.trim(),
        code: trimmedCode,
        password,
      });

      // Auto login with email from reset result
      const loginEmail = resetRes?.email || sentTo || email.trim();
      const loginData = await loginCustomer({
        email: loginEmail,
        password,
      });

      if (loginData?.token) {
        try {
          localStorage.setItem('medusa_token', loginData.token);
          localStorage.setItem(
            'nova.session',
            JSON.stringify({ email: loginEmail, at: Date.now() })
          );
        } catch (err) {
          /* ignore */
        }
      }

      setBar({
        kind: 'ok',
        html: 'Password reset successful! Logging you in…',
      });
      setTimeout(() => router.push('/account'), 1000);
    } catch (error) {
      const msg =
        error?.data?.message || error?.message || 'That code is not right or has expired.';
      setBar({
        kind: 'err',
        html: msg.includes('weak_password')
          ? 'Use at least 8 characters for your new password.'
          : 'That code is not right or has expired. You can request a new code.',
      });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBar({ kind: 'ok', html: 'We’ve sent the code again. It expires in 30 minutes.' });
    startCountdown(60);
    try {
      await requestPasswordReset(sentTo || email.trim());
    } catch (e) {
      /* ignore */
    }
  };

  const again = () => {
    setStep(1);
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setBar(null);
    setErr('');
    setCodeErr('');
    setPassErr('');
    setConfirmErr('');
    clearInterval(timer.current);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <AuthPanel
      img="/images/tech-sole-close.png"
      quote="“Locked myself out again and the reset code landed in four seconds. No drama.”"
      byline={`Marcus D. — verified ${STORE_NAME} customer`}
      back="Back to sign in"
      backHref="/account/login"
      eyebrow="Account recovery"
      title="Reset your password"
      sub={
        <>
          {step === 1
            ? 'Enter your account email and we’ll send a 6-digit verification code.'
            : `Enter the code sent to ${sentTo || email.trim()} along with your new password.`}{' '}
          <Link href="/account/login">Back to sign in</Link>
        </>
      }
    >
      <Notice bar={bar} />

      <form onSubmit={handleSendCode} noValidate hidden={step !== 1}>
        <div className={'field' + (err ? ' field--error' : '')}>
          <div className="field__head"><label htmlFor="femail">Email address</label></div>
          <div className="control control--icon">
            {MAIL}
            <input
              id="femail"
              ref={inputRef}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={typeEmail}
              aria-invalid={err ? 'true' : undefined}
            />
          </div>
          <p className="err">{err ? <><ErrIcon /><span>{err}</span></> : null}</p>
        </div>

        <button
          className="btn btn--dark btn--block"
          type="submit"
          disabled={busy}
          data-busy="Sending code…"
        >
          {busy ? <><span className="btn__spin" />Sending code…</> : 'Email me a verification code'}
        </button>
      </form>

      <div className="sent" hidden={step !== 2}>
        <div className="sent__icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
            <path d="m3 6.5 9 6 9-6" />
          </svg>
        </div>
        <h2 className="sent__title">Check your inbox</h2>
        <p className="sent__body">
          If an account exists for <span className="email">{sentTo}</span>, a 6-digit verification code was sent.
        </p>
        <p className="sent__hint">Enter the code below along with your new password to finish recovering your account.</p>

        <form onSubmit={handleConfirmReset} noValidate style={{ textAlign: 'left', marginTop: 24 }}>
          <div className={'field' + (codeErr ? ' field--error' : '')}>
            <div className="field__head"><label htmlFor="code">6-digit verification code</label></div>
            <div className="control control--icon">
              {KEY}
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeErr('');
                  setBar(null);
                }}
                aria-invalid={codeErr ? 'true' : undefined}
              />
            </div>
            <p className="err">{codeErr ? <><ErrIcon /><span>{codeErr}</span></> : null}</p>
          </div>

          <div className={'field' + (passErr ? ' field--error' : '')}>
            <div className="field__head"><label htmlFor="password">New password</label></div>
            <div className="control control--icon">
              {LOCK}
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="has-toggle"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPassErr('');
                  setBar(null);
                }}
                aria-invalid={passErr ? 'true' : undefined}
              />
              <button
                className="pw-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? EYE_OFF : EYE}
              </button>
            </div>
            <p className="err">{passErr ? <><ErrIcon /><span>{passErr}</span></> : null}</p>
          </div>

          <div className={'field' + (confirmErr ? ' field--error' : '')}>
            <div className="field__head"><label htmlFor="confirmPassword">Repeat new password</label></div>
            <div className="control control--icon">
              {LOCK}
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                className="has-toggle"
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmErr('');
                  setBar(null);
                }}
                aria-invalid={confirmErr ? 'true' : undefined}
              />
              <button
                className="pw-toggle"
                type="button"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirm((s) => !s)}
              >
                {showConfirm ? EYE_OFF : EYE}
              </button>
            </div>
            <p className="err">{confirmErr ? <><ErrIcon /><span>{confirmErr}</span></> : null}</p>
          </div>

          <button
            className="btn btn--dark btn--block"
            type="submit"
            disabled={busy}
            data-busy="Resetting password…"
            style={{ marginTop: 20 }}
          >
            {busy ? <><span className="btn__spin" />Resetting password…</> : 'Reset password & sign in'}
          </button>
        </form>

        <div className="sent__actions" style={{ marginTop: 24 }}>
          <p className="resend" hidden={left === 0}>
            You can request another code in <b>{left}</b>s.
          </p>
          <button
            className="btn btn--ghost btn--block"
            type="button"
            onClick={resend}
            hidden={left > 0}
            disabled={busy}
          >
            Resend the code
          </button>
          <Link className="linklike" href="/account/login">
            Return to sign in
          </Link>
          <button className="linklike" type="button" onClick={again}>
            Use a different email
          </button>
        </div>
      </div>

      <p className="auth__legal">For your security we never confirm whether an email is registered. Every address gets the same message.</p>

      <div className="auth__foot">
        <span>Still stuck?</span>
        <Link href="/pages/contact">
          Talk to customer care
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </AuthPanel>
  );
}
