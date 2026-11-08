/* Shared catalogue + formatting helpers for the shop, cart and checkout pages. */

export const CATS = [
  { id: 'mens', label: "Men's Sneakers" },
  { id: 'womens', label: "Women's Sneakers" },
  { id: 'running', label: 'Running Shoes' },
  { id: 'lifestyle', label: 'Lifestyle' }
];

export const CAT_LABEL = CATS.reduce((m, c) => { m[c.id] = c.label; return m; }, {});

export const SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
export const DEFAULT_SIZE = 42;

export const PRODUCTS = [
  { id: 'air-pro', name: 'Nova Air Pro', sub: 'Everyday Comfort', price: 563, cat: 'mens', img: 'prod-airpro', stock: true, badge: 'Bestseller' },
  { id: 'run-2', name: 'Nova Run 2.0', sub: 'Performance Running', price: 639, cat: 'running', img: 'prod-run2', stock: true },
  { id: 'glide', name: 'Nova Glide', sub: 'Lightweight & Versatile', price: 529, cat: 'lifestyle', img: 'prod-glide', stock: true },
  { id: 'court', name: 'Nova Court', sub: 'Classic Street Style', price: 569, cat: 'lifestyle', img: 'prod-court', stock: true },
  { id: 'trail-gtx', name: 'Nova Trail GTX', sub: 'All-Terrain Grip', price: 779, cat: 'running', img: 'cat-running', stock: true, badge: 'New' },
  { id: 'cloud-walk', name: 'Nova Cloud Walk', sub: 'All-Day Cushioning', price: 459, cat: 'womens', img: 'cat-womens', stock: false },
  { id: 'street-low', name: 'Nova Street Low', sub: 'Urban Sneaker', price: 419, cat: 'mens', img: 'cat-mens', stock: true },
  { id: 'metro-knit', name: 'Nova Metro Knit', sub: 'Breathable Everyday', price: 499, cat: 'lifestyle', img: 'cat-lifestyle', stock: true },
  { id: 'air-pro-mid', name: 'Nova Air Pro Mid', sub: 'High-Top Support', price: 679, cat: 'mens', img: 'hero-shoe', stock: true, badge: 'New' },
  { id: 'tempo-race', name: 'Nova Tempo Race', sub: 'Carbon Plate Ride', price: 929, cat: 'running', img: 'banner-men', stock: true },
  { id: 'linen-slip', name: 'Nova Linen Slip', sub: 'Easy On / Off', price: 359, cat: 'womens', img: 'banner-women', stock: true },
  { id: 'court-classic', name: 'Nova Court Classic', sub: 'Retro Hardwood', price: 599, cat: 'lifestyle', img: 'prod-court', stock: true },
  { id: 'drift-runner', name: 'Nova Drift Runner', sub: 'Daily Trainer', price: 519, cat: 'running', img: 'prod-run2', stock: false },
  { id: 'terra-hike', name: 'Nova Terra Hike', sub: 'Rugged Outsole', price: 819, cat: 'mens', img: 'cat-running', stock: true },
  { id: 'silk-road', name: 'Nova Silk Road', sub: 'Premium Leather', price: 999, cat: 'womens', img: 'cat-womens', stock: true, badge: 'Bestseller' },
  { id: 'step-lite', name: 'Nova Step Lite', sub: 'First Sneaker', price: 329, cat: 'lifestyle', img: 'cat-lifestyle', stock: true },
  { id: 'pulse-train', name: 'Nova Pulse Train', sub: 'Gym & Training', price: 589, cat: 'running', img: 'cat-mens', stock: true },
  { id: 'air-pro-wide', name: 'Nova Air Pro Wide', sub: 'Wide Fit Comfort', price: 619, cat: 'mens', img: 'prod-airpro', stock: false }
];

const BY_ID = PRODUCTS.reduce((m, p) => { m[p.id] = p; return m; }, {});

export function byId(id) { return BY_ID[id]; }

/* Multi-image support: every studio cut-out can declare alternate angles, and
   products that reuse the artwork inherit them. No entry = one-frame gallery. */
export const ANGLES = {
  'prod-airpro': [['prod-airpro-top', 'Top-down'], ['prod-airpro-front', 'Heel angle'], ['prod-airpro-sole', 'Outsole'], ['prod-airpro-detail', 'Leather detail']],
  'prod-run2': [['prod-run2-top', 'Top-down'], ['prod-run2-front', 'Heel angle'], ['prod-run2-sole', 'Outsole']],
  'prod-glide': [['prod-glide-top', 'Top-down'], ['prod-glide-front', 'Heel angle'], ['prod-glide-sole', 'Outsole']],
  'prod-court': [['prod-court-top', 'Top-down'], ['prod-court-front', 'Heel angle'], ['prod-court-sole', 'Outsole']]
};

// [{ img, view, src, alt }]
export function gallery(p) {
  if (!p) return [];
  return [[p.img, 'Main view']].concat(ANGLES[p.img] || [])
    .map((f) => ({ img: f[0], view: f[1], src: '/images/' + f[0] + '.png', alt: p.name + ' — ' + f[1].toLowerCase() }));
}

export function productUrl(id) { return '/product/' + encodeURIComponent(id); }

/* One carrier, one flat rate — Aramex collects the cash on delivery. */
export const SHIPPING = [
  { id: 'aramex', label: 'Aramex', eta: 'Standard Tunisia Delivery · 3–5 working days', cost: 10, method: 'Aramex' }
];

import { formatPrice } from './medusa';

export { formatPrice };

// dp: 2 (default) ledger amounts, 1 compact meta lines, 0 whole-dinar labels
export function money(v, dp) {
  return formatPrice(v, 'TND', dp);
}
