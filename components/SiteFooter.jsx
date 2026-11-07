import Link from 'next/link';
import { CATS } from '@/lib/nova';
import { Facebook, Instagram, TikTok } from './icons';

const SOCIAL = [
  { label: 'TikTok', Icon: TikTok },
  { label: 'Facebook', Icon: Facebook },
  { label: 'Instagram', Icon: Instagram }
];

const SUPPORT = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns', href: '/returns' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' }
];

export default function SiteFooter() {
  return (
    <footer className="foot">
      <div className="container">
        <div className="foot__grid">
          <div className="foot__brand">
            <Link className="foot__logo" href="/">NOVA</Link>
            <p className="foot__tagline">
              Modern footwear for a bolder tomorrow. Cash on delivery across Tunisia,
              shipped nationwide with Aramex.
            </p>
            <div className="foot__social">
              {SOCIAL.map(({ label, Icon }) => (
                <a key={label} href="/" aria-label={label}><Icon /></a>
              ))}
            </div>
          </div>

          <div className="foot__col">
            <h2>Shop</h2>
            <Link href="/shop">All products</Link>
            {CATS.map((c) => <Link key={c.id} href={'/shop?cat=' + c.id}>{c.label}</Link>)}
          </div>

          <div className="foot__col">
            <h2>Support</h2>
            {SUPPORT.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}
          </div>
        </div>

        <div className="foot__bottom">
          <p>&copy; {new Date().getFullYear()} NOVA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
