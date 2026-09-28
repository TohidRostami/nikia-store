"use client";

import { useEffect, useState } from "react";
import { getCartItemsStatus, type CartItemStatus } from "@/app/(shop)/cart/actions";
import { MAX_LINE_QUANTITY } from "@/lib/product-constants";
import { useCartStore } from "@/lib/store/cart";
import { useHydrated } from "@/lib/use-hydrated";

/** The most of this line the customer can order right now. */
export function maxQuantity(status: CartItemStatus | undefined): number {
  return status ? Math.min(MAX_LINE_QUANTITY, status.stock) : MAX_LINE_QUANTITY;
}

/**
 * The cart lives in the browser, so what it remembers (price, stock) can be
 * days old. On every visit to the cart or checkout this re-checks each line
 * against the database: prices are refreshed, quantities are clamped to
 * stock, and unavailable lines are reported so the page can flag them.
 *
 * `status` is null while the check is running (or nothing to check).
 */
export function useCartSync() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const [fetched, setFetched] = useState<{ key: string; map: Record<string, CartItemStatus> } | null>(null);

  const key = items.map((i) => `${i.productId}:${i.variantId}`).join("|");

  useEffect(() => {
    if (!hydrated || !key) return;
    let alive = true;
    const current = useCartStore.getState().items;

    getCartItemsStatus(current.map((i) => ({ productId: i.productId, variantId: i.variantId }))).then((list) => {
      if (!alive) return;
      const map = Object.fromEntries(list.map((s) => [s.variantId, s]));
      const { updatePrice, setQuantity } = useCartStore.getState();
      for (const item of useCartStore.getState().items) {
        const s = map[item.variantId];
        if (!s?.available) continue;
        if (s.price !== item.price) updatePrice(item.variantId, s.price);
        const max = maxQuantity(s);
        if (max > 0 && item.quantity > max) setQuantity(item.variantId, max);
      }
      setFetched({ key, map });
    });

    return () => {
      alive = false;
    };
  }, [hydrated, key]);

  const status = fetched && fetched.key === key ? fetched.map : null;
  return { hydrated, items, status, checking: hydrated && key !== "" && status === null };
}
