import { declareStorefrontLayout } from './medusa';

export const CATEGORY_TILE_PLACES = 4;

export const LAYOUT = {
  promo_banners: 2,
  sections: [
    { key: 'new_arrivals', count: 8 },
    { key: 'best_sellers', count: 4 },
    { key: 'featured', count: 4 },
  ],
};

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

