/* NOVA storefront utility functions */

import { formatPrice } from './medusa';

export function productUrl(id) {
  if (!id) return '/shop';
  return '/p/' + encodeURIComponent(id);
}

export { formatPrice };

export function money(v, dp) {
  return formatPrice(v, 'tnd', dp);
}
