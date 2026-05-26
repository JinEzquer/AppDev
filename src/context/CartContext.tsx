// @ts-nocheck
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { calculateOrderTotal, resolveProductOrder } from '../utils/productOrder';

const CartContext = createContext(null);

function lineKey(productId, orderUnit) {
  return `${productId}:${orderUnit || 'default'}`;
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);

  const addLine = useCallback((product, quantity, orderUnit) => {
    const order = resolveProductOrder(product);
    const unit =
      orderUnit ||
      order.unitOptions?.[0]?.key ||
      order.unit ||
      product.stockUnit ||
      'pcs';
    const key = lineKey(product.id, unit);
    const qty = Number(quantity) || order.min || 1;

    setLines(prev => {
      const idx = prev.findIndex(l => l.key === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          stockQuantity: product.stockQuantity,
          stockUnit: product.stockUnit,
          order: product.order || order,
          quantity: qty,
          orderUnit: unit,
        },
      ];
    });
  }, []);

  const updateLine = useCallback((key, patch) => {
    setLines(prev => prev.map(l => (l.key === key ? { ...l, ...patch } : l)));
  }, []);

  const removeLine = useCallback(key => {
    setLines(prev => prev.filter(l => l.key !== key));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const totals = useMemo(() => {
    let subtotal = 0;
    lines.forEach(line => {
      subtotal += calculateOrderTotal(line.price, line.quantity, line.order);
    });
    return { subtotal, count: lines.length, itemCount: lines.reduce((n, l) => n + 1, 0) };
  }, [lines]);

  const value = useMemo(
    () => ({
      lines,
      addLine,
      updateLine,
      removeLine,
      clearCart,
      totals,
    }),
    [lines, addLine, updateLine, removeLine, clearCart, totals],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
