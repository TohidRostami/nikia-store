import type { Metadata } from "next";
import { AddressManager } from "@/components/account/address-manager";
import { listAddressesForUser } from "@/lib/queries/addresses";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "آدرس‌ها", robots: { index: false } };

export default async function AddressesPage() {
  const session = await requireUser("/account/addresses");
  const addresses = await listAddressesForUser(session.user.id);
  const name = /^[\d۰-۹+\s]+$/.test(session.user.name) ? "" : session.user.name;

  return (
    <>
      <h1 className="text-[clamp(24px,3vw,32px)] font-normal">آدرس‌ها</h1>
      <AddressManager
        defaultName={name}
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
      />
    </>
  );
}
