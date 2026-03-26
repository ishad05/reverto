/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export interface CartItem {
  id: string;
  title: string;
  pricePerKg: number;
  quantityKg: number;    // selected quantity by the user
  availableKg: number;   // max available from the listing
  wasteType: string;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, newQty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
}

const GST_RATE = 0.18;

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, newQty: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const clamped = Math.min(Math.max(1, newQty), i.availableKg);
        return { ...i, quantityKg: clamped };
      }),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.pricePerKg * i.quantityKg, 0),
    [items],
  );
  const gstAmount = useMemo(() => subtotal * GST_RATE, [subtotal]);
  const grandTotal = useMemo(() => subtotal + gstAmount, [subtotal, gstAmount]);
  const totalItems = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        gstAmount,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
