'use client';
import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { Bag, Tick } from './icons';

/* Card quick-add: writes the default size, flashes a confirmation, opens the drawer. */
export default function AddToCartButton({ product, variant = product?.singleVariant, disabled = false, ...rest }) {
  const { add, openDrawer } = useCart();
  const [added, setAdded] = useState(false);

  const label = disabled ? 'Sold out' : added ? 'Added' : 'Add';

  return (
    <button
      className={'prod__cart' + (added ? ' is-added' : '')}
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        const variantId = variant?.id || product?.singleVariant?.id;
        add(product.id, variantId, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 600);
        openDrawer(e.currentTarget);
      }}
      {...rest}
    >
      {added ? <Tick size={13} width={3} /> : <Bag size={14} />}
      <span className="prod__cartlabel">{label}</span>
    </button>
  );
}
