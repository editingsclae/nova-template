import '@/styles/styles.css';
import '@/styles/form.css';
import '@/styles/cart.css';
import { CartProvider } from '@/lib/cart';
import CartDrawer from '@/components/CartDrawer';
import { SiteDataProvider } from '@/components/SiteData';
import { STORE_NAME, getCategories, getFooterSettings } from '@/lib/medusa';

export const metadata = {
  metadataBase: new URL('https://nova.store.example'),
  title: {
    default: `${STORE_NAME} — Footwear for a Bolder Tomorrow`,
    template: `%s — ${STORE_NAME}`
  },
  description: 'Modern sneakers designed for everyday comfort, performance and style. Cash on delivery across Tunisia.'
};

export default async function RootLayout({ children }) {
  const [categories, footer] = await Promise.all([
    getCategories().catch((err) => {
      console.error('[layout] Failed to fetch categories:', err);
      return [];
    }),
    getFooterSettings().catch((err) => {
      console.error('[layout] Failed to fetch footer settings:', err);
      return {
        store_name: STORE_NAME,
        description: 'Cash on delivery across Tunisia.',
        social_links: [],
        shop_categories: [],
        pages: [],
      };
    }),
  ]);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SiteDataProvider categories={categories} footer={footer}>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </SiteDataProvider>
      </body>
    </html>
  );
}
