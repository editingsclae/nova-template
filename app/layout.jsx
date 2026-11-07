import '@/styles/styles.css';
import '@/styles/form.css';
import '@/styles/cart.css';
import { CartProvider } from '@/lib/cart';
import CartDrawer from '@/components/CartDrawer';

export const metadata = {
  metadataBase: new URL('https://nova.store.example'),
  title: {
    default: 'NOVA — Footwear for a Bolder Tomorrow',
    template: '%s — NOVA'
  },
  description: 'Modern sneakers designed for everyday comfort, performance and style. Cash on delivery across Tunisia.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
