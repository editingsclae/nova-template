'use client';

import { useState } from 'react';
import { X } from '@/components/icons';
import { useCart } from '@/lib/cart';
import {
  couponErrorMessage,
  getAppliedCoupons,
  normalizeCouponInput,
} from '@/lib/coupon';

/* The box where a shopper types a coupon code, with the codes already applied below it.
   Used in the cart and at checkout. */
export default function CouponBox() {
  const { cart, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const applied = getAppliedCoupons(cart);
  const canApply = !busy && normalizeCouponInput(code).length > 0;

  const apply = async () => {
    const clean = normalizeCouponInput(code);
    if (!clean) {
      setError('Enter a code.');
      return;
    }
    if (applied.includes(clean)) {
      setError('This code is already applied.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await applyCoupon(clean);
      // A code the backend did not keep is not valid for this store
      if (!getAppliedCoupons(updated).includes(clean)) {
        setError('This code is not valid.');
        return;
      }
      setCode('');
    } catch (err) {
      setError(couponErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (appliedCode) => {
    setBusy(true);
    setError(null);
    try {
      await removeCoupon(appliedCode);
    } catch (err) {
      setError(couponErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="coupon">
      <form
        className="coupon__row"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <label htmlFor="coupon-code" className="coupon__label">Coupon code</label>
        <input
          id="coupon-code"
          className="coupon__input"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Coupon code"
          autoComplete="off"
          autoCapitalize="characters"
        />
        <button className="btn btn--dark btn--sm" type="submit" disabled={!canApply}>
          {busy ? '...' : 'Apply'}
        </button>
      </form>

      {error ? (
        <p className="coupon__err" role="alert">{error}</p>
      ) : null}

      {applied.length > 0 ? (
        <ul className="coupon__tags">
          {applied.map((appliedCode) => (
            <li className="coupon__tag" key={appliedCode}>
              <span>{appliedCode}</span>
              <button
                className="coupon__x"
                type="button"
                disabled={busy}
                aria-label={`Remove coupon ${appliedCode}`}
                onClick={() => remove(appliedCode)}
              >
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
