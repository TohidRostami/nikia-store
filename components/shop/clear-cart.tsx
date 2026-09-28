"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store/cart";

/** Rendered on the "payment succeeded" screen: only now is the cart emptied. */
export function ClearCart() {
  useEffect(() => {
    useCartStore.getState().clear();
  }, []);
  return null;
}
