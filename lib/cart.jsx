'use client';
/* Cart store backed by localStorage + slide-in drawer state.
   Demo only: nothing is charged. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { byId, DEFAULT_SIZE, SHIPPING } from './nova';

const KEY = 'nova.cart';
export const MAX_QTY = 10;

const SEED = [
  { id: 'air-pro', size: 42, qty: 1 },
  { id: 'run-2', size: 41, qty: 1 }
];

const CartCtx = createContext(null);

function readStored() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) || [];
  } catch (e) {
    return [];
  }
}

export function CartProvider({ children }) {
  // null = nothing read yet, so server markup never claims a basket
  const [items, setItems] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const returnFocus = useRef(null);

  useEffect(() => {
    setItems(readStored());
    const onStorage = (e) => { if (e.key === KEY) setItems(readStored()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const commit = useCallback((next) => {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) { /* private mode */ }
  }, []);

  const add = useCallback((id, size, qty) => {
    setItems((current) => {
      const list = (current || readStored()).map((l) => ({ ...l }));
      const s = size || DEFAULT_SIZE;
      const found = list.find((l) => l.id === id && l.size === s);
      if (found) found.qty = Math.min(MAX_QTY, found.qty + (qty || 1));
      else list.push({ id, size: s, qty: Math.min(MAX_QTY, qty || 1) });
      try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
      return list;
    });
  }, []);

  const setQty = useCallback((index, qty) => {
    setItems((current) => {
      if (!current || !current[index]) return current;
      const list = current.map((l) => ({ ...l }));
      list[index].qty = Math.max(1, Math.min(MAX_QTY, qty));
      try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
      return list;
    });
  }, []);

  const remove = useCallback((index) => {
    setItems((current) => {
      if (!current) return current;
      const list = current.map((l) => ({ ...l }));
      list.splice(index, 1);
      try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
      return list;
    });
  }, []);

  const setSize = useCallback((index, size) => {
    setItems((current) => {
      if (!current || !current[index]) return current;
      const list = current.map((l) => ({ ...l }));
      list[index].size = +size;
      try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
      return list;
    });
  }, []);

  const clear = useCallback(() => commit([]), [commit]);

  const lines = useMemo(() => {
    if (!items) return [];
    return items.map((l, i) => {
      const p = byId(l.id);
      if (!p) return null;
      return {
        i, id: p.id, name: p.name, sub: p.sub, img: p.img, price: p.price,
        size: l.size, qty: l.qty, line: p.price * l.qty, stock: p.stock
      };
    }).filter(Boolean);
  }, [items]);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.line, 0);

  const totals = useCallback(() => {
    const method = SHIPPING[0];
    return {
      subtotal, shipping: method.cost, total: subtotal + method.cost, method
    };
  }, [subtotal]);

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

  const ready = items !== null;
  const value = {
    ready, items: items || [], lines, count, subtotal, totals,
    add, setQty, setSize, remove, clear,
    drawerOpen, openDrawer, closeDrawer, MAX_QTY
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
