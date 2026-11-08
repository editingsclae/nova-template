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

const MAIL = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6.5 9 6 9-6" /></svg>;
const LOCK = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10.5" width="16" height="10.5" rx="2.5" /><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /></svg>;
const KEY = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 8.2-8.2m-3 3 2 2m-4-1 2 2" /></svg>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const ErrIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5m0 3.2v.3" /></svg>
);

export default function ForgotForm() {
  const router = useRouter();

  // Step 1: email, Step 2: code + new passwords
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [err, setErr] = useState('');
  const [bar, setBar] = useState(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(60);

  const timer = useRef(null);

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

  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    setBar(null);
    setErr('');

    const trimmed = email.trim();
    if (!trimmed) {
      setErr('Email is required.');
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setErr('Enter a valid email address.');
      return;
    }

    setBusy(true);
    try {
      const res = await requestPasswordReset(trimmed);
      setStep(2);
      setBar({
        kind: 'ok',
        html: `If there is an account for ${trimmed}, we sent a code.`,
      });
      startCountdown(res?.can_resend_in || 60);
    } catch (err) {
      // Always show standard notice even on error per rule 29
      setStep(2);
      setBar({
        kind: 'ok',
        html: `If there is an account for ${trimmed}, we sent a code.`,
      });
      startCountdown(60);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setBar(null);
    setErr('');

    const trimmedCode = code.replace(/\D/g, '');
    if (!trimmedCode || trimmedCode.length !== 6) {
      setErr('Enter the 6-digit verification code.');
      return;
    }

    if (!password || password.length < 8) {
      setErr('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const resetRes = await confirmPasswordReset({
        email: email.trim(),
        code: trimmedCode,
        password,
      });

      // Auto login with email from reset result
      const loginEmail = resetRes?.email || email.trim();
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
        } catch (e) {
          /* ignore */
        }
      }

      setBar({
        kind: 'ok',
        html: 'Password reset successful! Logging you in…',
      });
      setTimeout(() => router.push('/account'), 1000);
    } catch (err) {
      const msg =
        err?.data?.message || err?.message || 'That code is not right or has expired.';
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
            : `Enter the code sent to ${email.trim()} along with your new password.`}{' '}
          <Link href="/account/login">Back to sign in</Link>
        </>
      }
    >
      <Notice bar={bar} />

      {step === 1 ? (
        <form onSubmit={handleSendCode} noValidate>
          <div className={'field' + (err ? ' field--err' : '')}>
            <label htmlFor="femail">Email address</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">{MAIL}</span>
              <input
                id="femail"
                type="email"
                autoComplete="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErr('');
                }}
                required
                autoFocus
              />
            </div>
            {err && <p className="err-hint"><ErrIcon /> {err}</p>}
          </div>

          <button className="btn btn--dark btn--block" type="submit" disabled={busy}>
            {busy ? 'Sending code…' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirmReset} noValidate>
          <div className="field">
            <label htmlFor="reset-code">6-digit Code</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">{KEY}</span>
              <input
                id="reset-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="new-pass">New Password</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">{LOCK}</span>
              <input
                id="new-pass"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
              <button
                className="eye-btn"
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? EYE_OFF : EYE}
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="confirm-pass">Repeat New Password</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">{LOCK}</span>
              <input
                id="confirm-pass"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
              />
              <button
                className="eye-btn"
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? EYE_OFF : EYE}
              </button>
            </div>
          </div>

          {err && <p className="err-hint" style={{ marginBottom: 16 }}><ErrIcon /> {err}</p>}

          <button className="btn btn--dark btn--block" type="submit" disabled={busy}>
            {busy ? 'Resetting password…' : 'Reset Password & Sign In'}
          </button>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <button
              type="button"
              className="field-link"
              onClick={() => handleSendCode()}
              disabled={left > 0 || busy}
            >
              {left > 0 ? `Resend code in ${left}s` : 'Resend code'}
            </button>
            <button
              type="button"
              className="field-link"
              onClick={() => {
                setStep(1);
                setCode('');
                setBar(null);
                setErr('');
              }}
            >
              Use a different email
            </button>
          </div>
        </form>
      )}
    </AuthPanel>
  );
}
