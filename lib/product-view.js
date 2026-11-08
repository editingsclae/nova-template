/* Product view mapper: adapts Medusa v2 product models to NOVA's view model.
   Keeps existing components working without altering the design. */

import { cleanCategoryHandle } from './medusa.js';

export function mapProduct(p, currency_code = '') {
  if (!p) return null;

  const variants = p.variants || [];
  const prices = variants
    .map((v) => v.calculated_price?.calculated_amount)
    .filter((n) => typeof n === 'number' && !isNaN(n));

  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const from = prices.length > 1 && minPrice !== maxPrice;
  const currencyCode =
    currency_code || variants[0]?.calculated_price?.currency_code || '';

  // Stock is true when at least one variant has inventory_quantity > 0
  const stock = variants.some((v) => (v.inventory_quantity ?? 0) > 0);

  // Badge from metadata.badge only (at most 16 characters, never invented)
  let badge = null;
  if (
    p.metadata?.badge &&
    typeof p.metadata.badge === 'string' &&
    p.metadata.badge.trim().length > 0 &&
    p.metadata.badge.trim().length <= 16
  ) {
    badge = p.metadata.badge.trim();
  }

  // Filter out placeholder "Default Option"
  const options = (p.options || []).filter(
    (opt) => opt.title !== 'Default Option'
  );

  const images = (p.images || []).map((img) => (typeof img === 'string' ? img : img.url));
  const primaryImg = p.thumbnail || images[0] || '';

  const firstCat = p.categories?.[0];
  const cat = firstCat ? cleanCategoryHandle(firstCat.handle) : '';

  return {
    raw: p,
    id: p.id,
    handle: p.handle,
    name: p.title || '',
    sub: p.subtitle || '',
    price: minPrice,
    from,
    currencyCode,
    img: primaryImg,
    images: images.length ? images : (primaryImg ? [primaryImg] : []),
    stock,
    badge,
    cat,
    category: firstCat || null,
    categories: p.categories || [],
    options,
    variants,
    hasMultipleVariants: variants.length > 1,
    singleVariantInStock:
      variants.length === 1 && (variants[0].inventory_quantity ?? 0) > 0,
    singleVariant: variants.length === 1 ? variants[0] : null,
  };
}

export function mapProducts(list, currency_code = '') {
  if (!Array.isArray(list)) return [];
  return list.map((p) => mapProduct(p, currency_code)).filter(Boolean);
}
