import type { Metadata } from "next";
import { PackageOpen } from "lucide-react";
import { OrderRow } from "@/components/account/order-row";
import { EmptyState } from "@/components/shared/empty-state";
import { getOrdersForCustomer } from "@/lib/queries/orders";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "سفارش‌های من", robots: { index: false } };

export default async function OrdersPage() {
  const session = await requireUser("/account/orders");
  const orders = await getOrdersForCustomer(session.user.id);

  return (
    <>
      <h1 className="text-[clamp(24px,3vw,32px)] font-normal">سفارش‌های من</h1>
      {orders.length === 0 ? (
        <EmptyState icon={PackageOpen} title="هنوز سفارشی ثبت نکرده‌اید" actionLabel="شروع خرید" actionHref="/products" />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      )}
    </>
  );
}
