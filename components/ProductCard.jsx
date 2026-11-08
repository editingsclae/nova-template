import Link from 'next/link';
import { formatPrice } from '@/lib/medusa';
import { productUrl } from '@/lib/nova';
import AddToCartButton from './AddToCartButton';

/* Compact card used by the shop grid. Out-of-stock styles grey the photo and kill the button. */
export default function ProductCard({ p }) {
  const imgSrc =
    p.img?.startsWith('http') || p.img?.startsWith('/')
      ? p.img
      : '/images/' + p.img + '.png';

  const href = productUrl(p.handle || p.id);
  const showFrom = Boolean(p.from);
  const priceDisplay = (showFrom ? 'From ' : '') + formatPrice(p.price, p.currencyCode);

  // If product has multiple variants, link to product page to choose options instead of single-click add
  const showOptionsLink = p.hasMultipleVariants && p.stock;

  return (
    <article className={'prod' + (p.stock ? '' : ' prod--out')}>
      <div className="prod__media">
        {p.badge ? <span className="tag">{p.badge}</span> : null}
        <img src={imgSrc} alt={p.name} loading="lazy" />
      </div>
      <div className="prod__body">
        <h4><Link className="prod__name" href={href}>{p.name}</Link></h4>
        {p.sub && <p className="prod__sub">{p.sub}</p>}
        <div className="prod__row">
          <span className="prod__price">{priceDisplay}</span>
          {p.stock ? (
            p.singleVariantInStock ? (
              <AddToCartButton product={p} variant={p.singleVariant} aria-label={`Add ${p.name} to cart`} />
            ) : (
              <Link className="btn btn--ghost btn--sm" href={href}>
                Choose options
              </Link>
            )
          ) : (
            <AddToCartButton product={p} variant={p.singleVariant} disabled aria-label={`Sold out: ${p.name}`} />
          )}
        </div>
        <p className="prod__stock">
          <span className="dotstock" />
          {p.stock ? 'In stock' : 'Currently unavailable'}
        </p>
      </div>
    </article>
  );
}
