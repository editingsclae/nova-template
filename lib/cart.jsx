'use client';

/* Real Medusa v2 cart provider.
   Keeps only the cart ID in localStorage (no seed, no local mock data).
   Lines carry variant_id, show real variant_title, and display quantity errors. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createCart,
  getCart,
  addToCart,
  updateCartLine,
  removeCartLine,
  addShippingMethod,
  cleanVariantTitle,
} from './medusa';

export const CART_ID_KEY = 'medusa_cart_id';
export const MAX_QTY = 10;

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [ready, setReady] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingLines, setRemovingLines] = useState({});
  const [lineErrors, setLineErrors] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const returnFocus = useRef(null);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  // Load existing cart from backend on mount
  const loadCart = useCallback(async () => {
    try {
      const storedId = localStorage.getItem(CART_ID_KEY);
      if (!storedId) {
        setReady(true);
        return;
      }

      const fetched = await getCart(storedId);
      // If cart is already completed or not found, discard the stored id
      if (!fetched || fetched.completed_at) {
        localStorage.removeItem(CART_ID_KEY);
        cartRef.current = null;
        setCart(null);
      } else {
        cartRef.current = fetched;
        setCart(fetched);
      }
    } catch (e) {
      console.error('[cart] Failed to load cart:', e);
      try {
        localStorage.removeItem(CART_ID_KEY);
      } catch (err) {}
      cartRef.current = null;
      setCart(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Ensure cart exists on backend before mutations
  const ensureCart = useCallback(async () => {
    const current = cartRef.current;
    if (current && current.id && !current.completed_at) return current;
    const storedId = typeof window !== 'undefined' ? localStorage.getItem(CART_ID_KEY) : null;
    if (storedId) {
      if (current && current.id === storedId && !current.completed_at) {
        return current;
      }
      try {
        const fetched = await getCart(storedId);
        if (fetched && !fetched.completed_at) {
          cartRef.current = fetched;
          setCart(fetched);
          return fetched;
        }
      } catch (e) {
        try {
          localStorage.removeItem(CART_ID_KEY);
        } catch (err) {}
      }
    }
    const newCart = await createCart();
    if (newCart?.id) {
      try {
        localStorage.setItem(CART_ID_KEY, newCart.id);
      } catch (e) {}
      cartRef.current = newCart;
      setCart(newCart);
      return newCart;
    }
    throw new Error('Unable to initialize cart');
  }, []);

  // Add line item
  const add = useCallback(
    async (productId, variantId, qty = 1, meta = {}) => {
      setLineErrors({});
      setAdding(true);
      try {
        const activeCart = await ensureCart();
        const updated = await addToCart(activeCart.id, {
          variantId,
          quantity: Math.min(MAX_QTY, Math.max(1, qty)),
        });
        if (updated) {
          cartRef.current = updated;
          setCart(updated);
        }
        return updated;
      } catch (err) {
        console.error('[cart] Add error:', err);
        const msg = err?.data?.message || err?.message || 'Could not add item to cart';
        if (variantId) {
          setLineErrors((prev) => ({ ...prev, [variantId]: msg }));
        }
        throw err;
      } finally {
        setAdding(false);
      }
    },
    [ensureCart]
  );

  // Remove line item
  const remove = useCallback(
    async (lineId) => {
      const activeCart = cartRef.current;
      if (!activeCart || !lineId) return;
      if (removingLines[lineId]) return;

      setRemovingLines((prev) => ({ ...prev, [lineId]: true }));
      setLineErrors((prev) => {
        const next = { ...prev };
        delete next[lineId];
        return next;
      });

      try {
        const updated = await removeCartLine(activeCart.id, lineId);
        if (updated) {
          cartRef.current = updated;
          setCart(updated);
        }
        return updated;
      } catch (err) {
        console.error('[cart] Remove error:', err);
        const msg = err?.data?.message || err?.message || 'Could not remove item from cart';
        setLineErrors((prev) => ({ ...prev, [lineId]: msg }));
      } finally {
        setRemovingLines((prev) => {
          const next = { ...prev };
          delete next[lineId];
          return next;
        });
      }
    },
    [removingLines]
  );

  // Update line item quantity
  const setQty = useCallback(
    async (lineId, quantity) => {
      const activeCart = cartRef.current;
      if (!activeCart || !lineId) return;
      if (quantity <= 0) {
        return await remove(lineId);
      }
      setLineErrors((prev) => {
        const next = { ...prev };
        delete next[lineId];
        return next;
      });

      const nextQty = Math.min(MAX_QTY, quantity);
      try {
        const updated = await updateCartLine(activeCart.id, lineId, nextQty);
        if (updated) {
          cartRef.current = updated;
          setCart(updated);
        }
        return updated;
      } catch (err) {
        console.error('[cart] Update qty error:', err);
        const msg = err?.data?.message || err?.message || 'Quantity could not be updated';
        setLineErrors((prev) => ({ ...prev, [lineId]: msg }));
      }
    },
    [remove]
  );

  // Set shipping method
  const setShippingMethod = useCallback(
    async (optionId) => {
      if (!cart?.id || !optionId) return;
      try {
        const updated = await addShippingMethod(cart.id, optionId);
        if (updated) setCart(updated);
        return updated;
      } catch (err) {
        console.error('[cart] Set shipping method error:', err);
        throw err;
      }
    },
    [cart?.id]
  );

  // Clear entire cart
  const clear = useCallback(async () => {
    try {
      localStorage.removeItem(CART_ID_KEY);
    } catch (e) {}
    cartRef.current = null;
    setCart(null);
    setLineErrors({});
  }, []);

  // Format cart lines for views
  const lines = useMemo(() => {
    if (!cart || !Array.isArray(cart.items)) return [];

    return cart.items.map((item, idx) => {
      const variant = item.variant;
      const vTitle = cleanVariantTitle(item.variant_title || variant?.title);

      const pTitle = item.product_title || item.title || 'Sneaker';
      const pHandle = item.product_handle || variant?.product?.handle || '';
      const thumbnail =
        item.thumbnail || variant?.product?.thumbnail || item.variant?.thumbnail || '';

      const unitPrice = item.unit_price ?? 0;
      const totalLine = item.total ?? unitPrice * item.quantity;

      return {
        id: item.id,
        lineId: item.id,
        i: idx,
        variantId: item.variant_id,
        productId: item.product_id,
        handle: pHandle,
        name: pTitle,
        variantTitle: vTitle,
        sub: item.subtitle || (vTitle ? vTitle : ''),
        img: thumbnail,
        price: unitPrice,
        qty: item.quantity,
        line: totalLine,
        stock: (variant?.inventory_quantity ?? 1) > 0,
        removing: Boolean(removingLines[item.id]),
        error: lineErrors[item.id] || lineErrors[item.variant_id] || null,
      };
    });
  }, [cart, lineErrors, removingLines]);

  const count = useMemo(() => {
    return lines.reduce((total, l) => total + l.qty, 0);
  }, [lines]);

  const subtotal = useMemo(() => {
    return cart?.item_subtotal ?? cart?.subtotal ?? lines.reduce((total, l) => total + l.line, 0);
  }, [cart, lines]);

  const totals = useCallback(() => {
    const itemSub = cart?.item_subtotal ?? cart?.subtotal ?? 0;
    const shipping = cart?.shipping_subtotal ?? 0;
    const tax = cart?.tax_total ?? 0;
    const total = cart?.total ?? itemSub + shipping + tax;
    const currencyCode = cart?.currency_code || 'tnd';

    return {
      subtotal: itemSub,
      shipping,
      tax,
      total,
      currencyCode,
    };
  }, [cart]);

  const openDrawer = useCallback((trigger) => {
    returnFocus.current = trigger && trigger.focus ? trigger : document.activeElement;
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    if (returnFocus.current && returnFocus.current.focus) returnFocus.current.focus();
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    document.documentElement.classList.add('drawer-open');
    return () => document.documentElement.classList.remove('drawer-open');
  }, [drawerOpen]);

  const value = {
    cart,
    cartId: cart?.id || null,
    ready,
    adding,
    lines,
    count,
    subtotal,
    totals,
    add,
    setQty,
    remove,
    setShippingMethod,
    clear,
    refreshCart: loadCart,
    drawerOpen,
    openDrawer,
    closeDrawer,
    MAX_QTY,
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
