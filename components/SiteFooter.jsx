'use client';

import Link from 'next/link';
import { cleanCategoryHandle, STORE_NAME } from '@/lib/medusa';
import { useSiteData } from './SiteData';
import { Facebook, Instagram, TikTok } from './icons';

const ICON_MAP = {
  tiktok: TikTok,
  facebook: Facebook,
  instagram: Instagram,
};

const LABEL_MAP = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
  instagram: 'Instagram',
};

export default function SiteFooter() {
  const { footer } = useSiteData();
  const f = footer || {};

  const storeName = f.store_name || STORE_NAME;
  const description =
    f.description || 'Modern footwear for a bolder tomorrow. Cash on delivery across Tunisia.';

  // Render only valid social networks and only http(s) links
  const validSocial = (f.social_links || []).filter(
    (s) =>
      s &&
      s.network &&
      ICON_MAP[s.network.toLowerCase()] &&
      s.url &&
      /^https?:\/\//i.test(s.url)
  );

  const shopCats = (f.shop_categories || []).slice(0, 5);
  const supportPages = f.pages || [];

  return (
    <footer className="foot">
      <div className="container">
        <div className="foot__grid">
          <div className="foot__brand">
            <Link className="foot__logo" href="/">{storeName}</Link>
            <p className="foot__tagline">{description}</p>
            {validSocial.length > 0 && (
              <div className="foot__social">
                {validSocial.map((item) => {
                  const net = item.network.toLowerCase();
                  const Icon = ICON_MAP[net];
                  const label = LABEL_MAP[net] || item.network;
                  return (
                    <a
                      key={net}
                      href={item.url}
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="foot__col">
            <h2>Shop</h2>
            <Link href="/shop">All products</Link>
            {shopCats.map((c) => (
              <Link key={c.id || c.handle} href={'/c/' + encodeURIComponent(cleanCategoryHandle(c.handle))}>
                {c.name}
              </Link>
            ))}
          </div>

          {supportPages.length > 0 && (
            <div className="foot__col">
              <h2>Support</h2>
              {supportPages.map((item) => (
                <Link key={item.slug} href={'/pages/' + item.slug}>
                  {item.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="foot__bottom">
          <p>&copy; {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
