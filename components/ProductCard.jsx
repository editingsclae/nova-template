import Link from 'next/link';
import { money, productUrl } from '@/lib/nova';
import AddToCartButton from './AddToCartButton';

/* Compact card used by the shop grid. Out-of-stock styles grey the photo and kill the button. */
export default function ProductCard({ p }) {
  return (
    <article className={'prod' + (p.stock ? '' : ' prod--out')}>
      <div className="prod__media">
        {p.badge ? <span className="tag">{p.badge}</span> : null}
        <img src={'/images/' + p.img + '.png'} alt={p.name} loading="lazy" />
      </div>
      <div className="prod__body">
        <h4><Link className="prod__name" href={productUrl(p.id)}>{p.name}</Link></h4>
        <p className="prod__sub">{p.sub}</p>
        <div className="prod__row">
          <span className="prod__price">{money(p.price)}</span>
          <AddToCartButton product={p} aria-label={`Add ${p.name} to cart`} disabled={!p.stock} />
        </div>
        <p className="prod__stock"><span className="dotstock" />{p.stock ? 'In stock' : 'Currently unavailable'}</p>
      </div>
    </article>
  );
}
