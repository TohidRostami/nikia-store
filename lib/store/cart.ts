import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  price: number;
  size: string | null;
  color: string | null;
  categorySlug: string;
  image: string | null;
  quantity: number;
};

export type AppliedDiscount = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
};

type CartState = {
  items: CartItem[];
  discountCode: AppliedDiscount | null;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  /** Syncs a stale cached price to the current database value — used
   * when the cart page re-validates against the server on load. */
  updatePrice: (variantId: string, price: number) => void;
  setDiscountCode: (discount: AppliedDiscount | null) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      discountCode: null,
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.variantId === item.variantId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity } : i,
                ),
        })),
      updatePrice: (variantId, price) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, price } : i,
          ),
        })),
      setDiscountCode: (discount) => set({ discountCode: discount }),
      clear: () => set({ items: [], discountCode: null }),
    }),
    { name: "nikia-cart", version: 1 },
  ),
);

export function useCartCount() {
  return useCartStore((state) =>
    state.items.reduce((sum, i) => sum + i.quantity, 0),
  );
}

export function useCartTotal() {
  return useCartStore((state) =>
    state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );
}
