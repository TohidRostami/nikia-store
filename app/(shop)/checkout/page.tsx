import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/shop/checkout-flow";
import { requireUser } from "@/lib/session";
import { listAddressesForUser } from "@/lib/queries/addresses";
import { getSiteSettings } from "@/lib/queries/settings";
import { phoneToLocal } from "@/lib/format";

export const metadata: Metadata = { title: "تکمیل سفارش", robots: { index: false } };

export default async function CheckoutPage() {
  const session = await requireUser("/checkout");
  const [addresses, settings] = await Promise.all([listAddressesForUser(session.user.id), getSiteSettings()]);

  const user = session.user as typeof session.user & { phoneNumber?: string | null };
  // Accounts created by phone are named after the number until the customer edits it.
  const name = /^[\d۰-۹+\s]+$/.test(user.name) ? "" : user.name;

  return (
    <CheckoutFlow
      defaultName={name}
      defaultPhone={user.phoneNumber ? phoneToLocal(user.phoneNumber) : ""}
      addresses={addresses.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        phone: a.phone,
        province: a.province,
        city: a.city,
        postalCode: a.postalCode,
        addressLine: a.addressLine,
        isDefault: a.isDefault,
      }))}
      shipping={{
        freeShippingThreshold: settings.freeShippingThreshold,
        standardShippingCost: settings.standardShippingCost,
      }}
    />
  );
}
