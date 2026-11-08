/* NOVA storefront utility functions */

import { formatPrice, cleanVariantTitle, countryName } from './medusa';

export function productUrl(id) {
  if (!id) return '/shop';
  return '/p/' + encodeURIComponent(id);
}

export { formatPrice, cleanVariantTitle, countryName };

export function money(v, dp) {
  return formatPrice(v, 'tnd', dp);
}
