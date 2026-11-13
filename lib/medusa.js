/* Single data layer for Medusa v2 Store API calls.
   Always uses sales-channel-scoped publishable key. Never calls /admin/*. */

export const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://api.getcardy.shop';

export const MEDUSA_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

export const STORE_NAME =
  process.env.NEXT_PUBLIC_STORE_NAME || 'NOVA';

export const STOREFRONT_LAYOUT_KEY =
  process.env.STOREFRONT_LAYOUT_KEY || '';

export const PRODUCT_FIELDS =
  '*variants.calculated_price,+variants.inventory_quantity,*categories,+metadata';

export const PRODUCT_DETAIL_FIELDS =
  '*variants.calculated_price,+variants.inventory_quantity,*categories,+metadata,*options,*options.values,*variants.options';

export const ALL_PRODUCT_FIELDS =
  '*variants.calculated_price,+variants.inventory_quantity,*categories,+metadata,*options,*options.values,*variants.options,+created_at';

export async function medusaFetch(path, options = {}) {
  const url = `${MEDUSA_BACKEND_URL}${path.startsWith('/') ? path : '/' + path}`;
  const headers = {
    'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
    ...(options.headers || {}),
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error || data.code)) ||
      res.statusText ||
      `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/* Category handles in the backend might have channel prefix "sc_...--". Strip it. */
export function cleanCategoryHandle(handle) {
  if (!handle) return '';
  return String(handle).replace(/^sc_[a-z0-9_]+--/i, '');
}

/* Format price using calculated_amount and region currency.
   dp: 2 default, 1 compact, 0 whole units */
export function formatPrice(amount, currencyCode = 'TND', dp = 2) {
  const val = Number(amount) || 0;
  const curr = String(currencyCode || 'TND').toUpperCase();
  const numStr =
    dp === 0
      ? Math.round(val).toLocaleString('en-US')
      : dp === 1
      ? (Math.round(val * 10) / 10).toFixed(1)
      : val.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  return `${curr} ${numStr}`;
}

/* Cached default region */
let cachedRegion = null;

export async function getDefaultRegion() {
  if (cachedRegion) return cachedRegion;
  try {
    const data = await medusaFetch('/store/regions');
    const regions = data?.regions || [];
    if (!regions.length) return null;

    // Prefer region with Tunisia (tn) or first
    const match =
      regions.find((r) =>
        r.countries?.some((c) => String(c.iso_2).toLowerCase() === 'tn')
      ) || regions[0];

    cachedRegion = match;
    return match;
  } catch (e) {
    console.error('[medusa] Failed to load regions:', e);
    return null;
  }
}

/* Categories for this merchant only (plain handles, product counts) */
export async function getCategories(query = {}) {
  const params = new URLSearchParams();
  if (query.hide_empty) params.set('hide_empty', 'true');
  if (query.handle) params.set('handle', query.handle);

  const qs = params.toString();
  const data = await medusaFetch(
    `/store/merchant/categories${qs ? '?' + qs : ''}`,
    { cache: 'no-store' }
  );
  return data?.categories || [];
}

/* Paged product fetching: limit 100, stops at 500 */
export async function getAllProducts({ regionId } = {}) {
  let rid = regionId;
  if (!rid) {
    const reg = await getDefaultRegion();
    rid = reg?.id;
  }

  const all = [];
  const limit = 100;
  let offset = 0;
  let total = Infinity;

  while (offset < total && all.length < 500) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      fields: ALL_PRODUCT_FIELDS,
    });
    if (rid) params.set('region_id', rid);

    const data = await medusaFetch(`/store/products?${params.toString()}`);
    const batch = data?.products || [];
    total = typeof data?.count === 'number' ? data.count : batch.length;
    all.push(...batch);

    if (!batch.length || batch.length < limit) break;
    offset += limit;
  }

  return all.slice(0, 500);
}

/* Detail page product lookup by handle */
export async function getProductByHandle(handle, { regionId } = {}) {
  let rid = regionId;
  if (!rid) {
    const reg = await getDefaultRegion();
    rid = reg?.id;
  }

  const params = new URLSearchParams({
    handle,
    fields: PRODUCT_DETAIL_FIELDS,
  });
  if (rid) params.set('region_id', rid);

  const data = await medusaFetch(`/store/products?${params.toString()}`);
  return data?.products?.[0] || null;
}

/* Product list by IDs in the exact requested order */
export async function getProductsByIds(ids, { regionId } = {}) {
  if (!ids || !ids.length) return [];

  let rid = regionId;
  if (!rid) {
    const reg = await getDefaultRegion();
    rid = reg?.id;
  }

  const params = new URLSearchParams({
    limit: String(ids.length),
    fields: PRODUCT_DETAIL_FIELDS,
  });
  ids.forEach((id) => params.append('id[]', id));
  if (rid) params.set('region_id', rid);

  const data = await medusaFetch(`/store/products?${params.toString()}`);
  const list = data?.products || [];

  // Reorder strictly by input ids, dropping any missing
  const map = new Map(list.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

/* Merchant appearance & sections */
export async function getStorefrontContent() {
  try {
    return await medusaFetch('/store/merchant/storefront', { cache: 'no-store' });
  } catch (e) {
    console.error('[medusa] Failed to get storefront content:', e);
    return { hero_slides: [], promo_banners: [], category_tiles: [] };
  }
}

export async function getHomeSections() {
  try {
    return await medusaFetch('/store/merchant/storefront/sections', {
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[medusa] Failed to get home sections:', e);
    return { declared: false, sections: [] };
  }
}

export async function getFooterSettings() {
  try {
    return await medusaFetch('/store/merchant/footer', { cache: 'no-store' });
  } catch (e) {
    console.error('[medusa] Failed to get footer:', e);
    return {
      store_name: STORE_NAME,
      description: 'Cash on delivery across Tunisia.',
      social_links: [],
      shop_categories: [],
      pages: [],
    };
  }
}

export async function getFooterPage(slug) {
  return await medusaFetch(`/store/merchant/pages/${slug}`, {
    cache: 'no-store',
  });
}

export async function declareStorefrontLayout(layoutBody) {
  if (!STOREFRONT_LAYOUT_KEY) {
    console.warn('[layout] No STOREFRONT_LAYOUT_KEY provided; skipping layout declaration.');
    return null;
  }
  return await medusaFetch('/store/merchant/storefront/layout', {
    method: 'PUT',
    headers: {
      'x-layout-key': STOREFRONT_LAYOUT_KEY,
    },
    body: layoutBody,
  });
}

/* Cart management */
export async function createCart(regionId) {
  let rid = regionId;
  if (!rid) {
    const reg = await getDefaultRegion();
    rid = reg?.id;
  }

  const body = {};
  if (rid) body.region_id = rid;
  const data = await medusaFetch('/store/carts', {
    method: 'POST',
    body,
  });
  return data?.cart;
}

export async function getCart(cartId) {
  if (!cartId) return null;
  const data = await medusaFetch(
    `/store/carts/${cartId}?fields=*items,*items.variant,*shipping_methods`
  );
  return data?.cart || null;
}

export async function addToCart(cartId, { variantId, quantity = 1 }) {
  const data = await medusaFetch(`/store/carts/${cartId}/line-items`, {
    method: 'POST',
    body: {
      variant_id: variantId,
      quantity,
    },
  });
  return data?.cart;
}

export async function updateCartLine(cartId, lineId, quantity) {
  const data = await medusaFetch(`/store/carts/${cartId}/line-items/${lineId}`, {
    method: 'POST',
    body: { quantity },
  });
  return data?.cart;
}

export async function removeCartLine(cartId, lineId) {
  const data = await medusaFetch(`/store/carts/${cartId}/line-items/${lineId}`, {
    method: 'DELETE',
  });
  if (data?.parent && data.parent.id) {
    return data.parent;
  }
  if (data?.cart && data.cart.id) {
    return data.cart;
  }
  return await getCart(cartId);
}

export async function updateCart(cartId, data) {
  const res = await medusaFetch(`/store/carts/${cartId}`, {
    method: 'POST',
    body: data,
  });
  return res?.cart;
}

export async function setCartCustomer(cartId, token) {
  if (!token || !cartId) return null;
  return await medusaFetch(`/store/carts/${cartId}/customer`, {
    method: 'POST',
    token,
  });
}

/* Shipping options */
export async function getShippingOptions(cartId) {
  if (!cartId) return [];
  const data = await medusaFetch(`/store/shipping-options?cart_id=${cartId}`);
  return data?.shipping_options || [];
}

export async function addShippingMethod(cartId, optionId) {
  const data = await medusaFetch(`/store/carts/${cartId}/shipping-methods`, {
    method: 'POST',
    body: { option_id: optionId },
  });
  return data?.cart;
}

/* Payment & Completion */
export async function createPaymentCollection(cartId) {
  const data = await medusaFetch('/store/payment-collections', {
    method: 'POST',
    body: { cart_id: cartId },
  });
  return data?.payment_collection;
}

export async function initiatePaymentSession(
  paymentCollectionId,
  providerId = 'pp_system_default'
) {
  const data = await medusaFetch(
    `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
    {
      method: 'POST',
      body: { provider_id: providerId },
    }
  );
  return data?.payment_collection;
}

export async function completeCart(cartId) {
  const data = await medusaFetch(`/store/carts/${cartId}/complete`, {
    method: 'POST',
  });
  return data;
}

/* Customer auth (Rules 10-13) */
export async function registerCustomer({
  email,
  password,
  firstName,
  lastName,
  phone,
}) {
  // Step 1: POST /auth/customer/emailpass/register
  const regRes = await medusaFetch('/auth/customer/emailpass/register', {
    method: 'POST',
    body: { email, password },
  });
  const regToken = regRes?.token;
  if (!regToken) throw new Error('Registration failed: no registration token');

  // Step 2: POST /store/customers with regToken
  await medusaFetch('/store/customers', {
    method: 'POST',
    token: regToken,
    body: {
      email,
      first_name: firstName,
      last_name: lastName,
      phone: phone || undefined,
    },
  });

  // Step 3: POST /auth/customer/emailpass (login to get real customer token)
  const loginRes = await medusaFetch('/auth/customer/emailpass', {
    method: 'POST',
    body: { email, password },
  });
  const token = loginRes?.token;
  if (!token) throw new Error('Post-registration login failed');

  // Step 4: trigger email verification code (fail quietly per rule 28)
  try {
    await sendEmailVerification(token);
  } catch (e) {
    /* ignore initial send error */
  }

  const customer = await getCustomer(token).catch(() => null);
  return { token, customer };
}

export async function loginCustomer({ email, password }) {
  const data = await medusaFetch('/auth/customer/emailpass', {
    method: 'POST',
    body: { email, password },
  });
  const token = data?.token;
  if (!token) throw new Error('Login failed: invalid response');

  const customer = await getCustomer(token).catch(() => null);
  return { token, customer };
}

export async function getCustomer(token) {
  if (!token) return null;
  const data = await medusaFetch('/store/customers/me', { token });
  return data?.customer || null;
}

export async function updateCustomer(token, body) {
  const data = await medusaFetch('/store/customers/me', {
    method: 'POST',
    token,
    body,
  });
  return data?.customer;
}

export const ORDER_DETAIL_FIELDS =
  '*items,*shipping_address,*shipping_methods,+email,+item_subtotal,+shipping_subtotal,+tax_total,+total,+fulfillment_status,+payment_status,+status';

export function getDerivedOrderStatus(order) {
  if (!order) return 'Order placed';
  const s = String(order.status || '').toLowerCase();
  const f = String(order.fulfillment_status || '').toLowerCase();
  if (s === 'canceled' || f === 'canceled') return 'Canceled';
  if (f === 'delivered') return 'Delivered';
  if (f === 'shipped') return 'Shipped';
  return 'Order placed';
}

export function cleanVariantTitle(title) {
  if (!title || typeof title !== 'string') return '';
  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower === 'default' ||
    lower === 'default variant' ||
    lower === 'default option'
  ) {
    return '';
  }
  return trimmed;
}

export function countryName(code) {
  if (!code) return '';
  const c = String(code).toLowerCase().trim();
  if (c === 'tn') return 'Tunisia';
  if (c === 'fr') return 'France';
  if (c === 'us') return 'United States';
  if (c === 'gb' || c === 'uk') return 'United Kingdom';
  if (c === 'de') return 'Germany';
  if (c === 'it') return 'Italy';
  if (c === 'es') return 'Spain';
  try {
    const intl = new Intl.DisplayNames(['en'], { type: 'region' });
    return intl.of(c.toUpperCase()) || c.toUpperCase();
  } catch (e) {
    return c.toUpperCase();
  }
}

export async function getCustomerOrders(token, fields = null) {
  if (!token) return [];
  const query = fields ? `?fields=${encodeURIComponent(fields)}` : '';
  const data = await medusaFetch(`/store/orders${query}`, {
    token,
    cache: 'no-store',
  });
  return data?.orders || [];
}

export async function getOrder(id, token = null, fields = ORDER_DETAIL_FIELDS) {
  const query = fields ? `?fields=${encodeURIComponent(fields)}` : '';
  const data = await medusaFetch(`/store/orders/${id}${query}`, {
    token: token || undefined,
    cache: 'no-store',
  });
  return data?.order || null;
}

export async function claimOrders(token, orderIds = null) {
  if (!token) return { claimed: 0, already_yours: 0 };
  const body = orderIds && orderIds.length ? { order_ids: orderIds } : {};
  return await medusaFetch('/store/merchant/claim-orders', {
    method: 'POST',
    token,
    body,
  });
}

export async function getEmailVerification(token) {
  return await medusaFetch('/store/merchant/email-verification', { token });
}

export async function sendEmailVerification(token) {
  return await medusaFetch('/store/merchant/email-verification', {
    method: 'POST',
    token,
    body: {},
  });
}

export async function confirmEmailVerification(token, code) {
  return await medusaFetch('/store/merchant/email-verification/confirm', {
    method: 'POST',
    token,
    body: { code },
  });
}

export async function requestPasswordReset(email) {
  return await medusaFetch('/store/merchant/password-reset', {
    method: 'POST',
    body: { email },
  });
}

export async function confirmPasswordReset({ email, code, password }) {
  return await medusaFetch('/store/merchant/password-reset/confirm', {
    method: 'POST',
    body: { email, code, password },
  });
}
