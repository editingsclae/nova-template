/* Coupon codes in the cart: what to show and what to say. No React here. */

// Codes are made of capital letters, numbers, - and _. A shopper may type small letters
// or leave a space around it.
export function normalizeCouponInput(raw) {
  return String(raw || '').replace(/\s+/g, '').toUpperCase();
}

export function getAppliedCoupons(cart) {
  const codes = (cart?.promotions || [])
    .map((p) => String(p?.code || '').trim())
    .filter(Boolean);
  return Array.from(new Set(codes));
}

// The money a coupon takes off, never below 0
export function getDiscountTotal(source) {
  const value = Number(source?.discount_total);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

// A problem placing the order that is about the coupon (a minimum order, for example).
// The shopper sees it under the coupon box, where they can fix it.
export function isCouponProblem(message) {
  return /coupon|promotion|promo code/i.test(String(message || ''));
}

// What to tell the shopper when a code is refused. The backend's own words are kept when
// they are about the order (a minimum, for example), because they say what to do.
export function couponErrorMessage(err) {
  const message = err instanceof Error ? err.message : '';
  if (/at least|minimum/i.test(message)) return message;
  // A coupon limited to one use per customer needs a signed-in shopper
  if (/customer_id|campaign budget|campaing budget/i.test(message)) {
    return 'Sign in to your account to use this coupon.';
  }
  if (/invalid|not found|expired|does not exist/i.test(message)) {
    return 'This code is not valid.';
  }
  return 'We could not apply this code. Please try again.';
}
