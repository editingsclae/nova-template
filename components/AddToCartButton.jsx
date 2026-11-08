'use client';
import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { Bag, Tick } from './icons';

/* Card quick-add: writes the default size, flashes a confirmation, opens the drawer. */
export default function AddToCartButton({ product, variant = product?.singleVariant, disabled = false, ...rest }) {
  const { add, openDrawer } = useCart();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(false);

  const label = disabled
    ? 'Sold out'
    : busy
    ? 'Adding…'
    : added
    ? 'Added'
    : error
    ? 'Try again'
    : 'Add';

  return (
    <button
      className={'prod__cart' + (added ? ' is-added' : '')}
      type="button"
      disabled={disabled || busy}
      onClick={async (e) => {
        e.preventDefault();
        if (disabled || busy) return;
        const trigger = e.currentTarget;
        const variantId = variant?.id || product?.singleVariant?.id;
        setBusy(true);
        setError(false);
        try {
          await add(product.id, variantId, 1);
          setAdded(true);
          setTimeout(() => setAdded(false), 600);
          openDrawer(trigger);
        } catch (err) {
          setError(true);
          setTimeout(() => setError(false), 2000);
        } finally {
          setBusy(false);
        }
      }}
      {...rest}
    >
      {added ? <Tick size={13} width={3} /> : <Bag size={14} />}
      <span className="prod__cartlabel">{label}</span>
    </button>
  );
}
