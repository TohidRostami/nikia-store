import type { Metadata } from "next";
import { CartView } from "@/components/shop/cart-view";
import { getSiteSettings } from "@/lib/queries/settings";

export const metadata: Metadata = { title: "سبد خرید", robots: { index: false } };

export default async function CartPage() {
  const settings = await getSiteSettings();
  return (
    <CartView
      shipping={{
        freeShippingThreshold: settings.freeShippingThreshold,
        standardShippingCost: settings.standardShippingCost,
      }}
    />
  );
}
