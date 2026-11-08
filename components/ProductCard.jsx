import Link from 'next/link';
import { formatPrice } from '@/lib/medusa';
import { productUrl } from '@/lib/nova';
import AddToCartButton from './AddToCartButton';

/* Product card. variant="home" renders the original two-column .best grid body
   without a stock line. Default renders the compact card for shop and category pages. */
export default function ProductCard({ p, variant }) {
  const imgSrc =
    p.img?.startsWith('http') || p.img?.startsWith('/')
      ? p.img
      : '/images/' + p.img + '.png';

  const href = productUrl(p.handle || p.id);
  const showFrom = Boolean(p.from);
  const priceDisplay = (showFrom ? 'From ' : '') + formatPrice(p.price, p.currencyCode);

  const cartButton = p.stock ? (
    p.singleVariantInStock ? (
      <AddToCartButton product={p} variant={p.singleVariant} aria-label={`Add ${p.name} to cart`} />
    ) : (
      <Link className="prod__cart prod__cart--opt" href={href}>
        Choose options
      </Link>
    )
  ) : (
    <AddToCartButton product={p} variant={p.singleVariant} disabled aria-label={`Sold out: ${p.name}`} />
  );

  if (variant === 'home') {
    return (
      <article className={'prod' + (p.stock ? '' : ' prod--out')}>
        <div className="prod__media">
          {p.badge ? <span className="tag">{p.badge}</span> : null}
          <img src={imgSrc} alt={p.name} loading="lazy" />
        </div>
        <div className="prod__body">
          <div className="prod__info">
            <h4><Link className="prod__name" href={href}>{p.name}</Link></h4>
            {p.sub && <p className="prod__sub">{p.sub}</p>}
            <p className="prod__price">{priceDisplay}</p>
          </div>
          {cartButton}
        </div>
      </article>
    );
  }

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
          {cartButton}
        </div>
        <p className="prod__stock">
          <span className="dotstock" />
          {p.stock ? 'In stock' : 'Currently unavailable'}
        </p>
      </div>
    </article>
  );
}
