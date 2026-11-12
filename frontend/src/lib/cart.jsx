import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "umkm_cart";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  // item: { id, slug, name, price, image_url, stock, quantity }
  const [items, setItems] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage penuh / diblokir — keranjang tetap jalan di memori */
    }
  }, [items]);

  const value = useMemo(() => {
    const setQty = (id, quantity) =>
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.id !== id)
          : prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(quantity, i.stock) } : i))
      );

    return {
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      total: items.reduce((s, i) => s + i.price * i.quantity, 0),
      add(product, quantity = 1) {
        setItems((prev) => {
          const found = prev.find((i) => i.id === product.id);
          if (found) {
            return prev.map((i) =>
              i.id === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) } : i
            );
          }
          const { id, slug, name, price, image_url, stock } = product;
          return [...prev, { id, slug, name, price, image_url, stock, quantity: Math.min(quantity, stock) }];
        });
      },
      setQty,
      remove: (id) => setQty(id, 0),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
