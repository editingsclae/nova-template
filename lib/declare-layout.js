import { declareStorefrontLayout } from './medusa';

export const CATEGORY_TILE_PLACES = 4;

export const LAYOUT = {
  promo_banners: 3,
  sections: [
    { key: 'new_arrivals', count: 8 },
    { key: 'best_sellers', count: 4 },
    { key: 'featured', count: 4 },
  ],
};

export function visibleSections(backendSections) {
  if (!Array.isArray(backendSections)) return [];
  const result = [];
  for (const decl of LAYOUT.sections) {
    const found = backendSections.find((s) => s && s.key === decl.key);
    if (!found || !Array.isArray(found.product_ids)) continue;
    const sliced = found.product_ids.filter(Boolean).slice(0, decl.count);
    if (sliced.length === 0) continue;
    result.push({
      key: decl.key,
      title: found.title,
      product_ids: sliced,
    });
  }
  return result;
}

export function visiblePromoBanners(banners) {
  if (!Array.isArray(banners)) return [];
  return banners.filter((b) => b && b.enabled !== false).slice(0, LAYOUT.promo_banners);
}

export async function declareLayout() {
  try {
    const result = await declareStorefrontLayout({
      promo_banners: LAYOUT.promo_banners,
      sections: LAYOUT.sections,
    });
    if (result) {
      console.log(
        `[layout] Declared ${LAYOUT.promo_banners} promo banner places and ${LAYOUT.sections.length} product sections.`
      );
    }
    return result;
  } catch (err) {
    console.warn('[layout] Could not declare storefront layout:', err?.message || err);
    return null;
  }
}
