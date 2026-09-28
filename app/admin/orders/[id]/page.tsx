import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { getOrderForAdmin } from "@/lib/queries/admin-orders";
import { formatPrice } from "@/lib/format";
import { formatJalali } from "@/lib/date";

export const metadata: Metadata = { title: "جزئیات سفارش | پنل مدیریت" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold">
              <span className="">{order.orderNumber}</span>
            </h1>
            <Badge variant="outline">
              {order.source === "IN_PERSON" ? "حضوری" : "آنلاین"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatJalali(order.createdAt)}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border p-6 lg:col-span-2">
          <h2 className="text-sm font-medium">اقلام سفارش</h2>
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between py-3 text-sm first:pt-0 last:pb-0"
              >
                <span>
                  {item.name}
                  {item.size && ` (${item.size})`}
                  <span className=" text-muted-foreground">
                    {" "}
                    × {item.quantity}
                  </span>
                </span>
                <span className="">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>جمع جزء</span>
              <span className="">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>تخفیف{order.discountCodeText ? ` (${order.discountCodeText})` : ""}</span>
                <span>−{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>هزینه ارسال</span>
              <span className="">{formatPrice(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-medium">
              <span>مجموع</span>
              <span className="">{formatPrice(order.total)} تومان</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {order.source === "ONLINE" && (
            <div className="rounded-lg border border-border p-6">
              <h2 className="text-sm font-medium">پرداخت</h2>
              <dl className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
                <div className="flex justify-between gap-3">
                  <dt>زمان پرداخت</dt>
                  <dd className="text-foreground">{order.paidAt ? formatJalali(order.paidAt) : "پرداخت نشده"}</dd>
                </div>
                {order.paymentRefId && (
                  <div className="flex justify-between gap-3">
                    <dt>کد پیگیری بانک</dt>
                    <dd className="font-nums text-foreground">{order.paymentRefId}</dd>
                  </div>
                )}
                {order.gatewayRef && (
                  <div className="flex justify-between gap-3">
                    <dt>شناسه درگاه</dt>
                    <dd className="font-nums max-w-[60%] truncate text-foreground" title={order.gatewayRef}>{order.gatewayRef}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="rounded-lg border border-border p-6">
            <h2 className="text-sm font-medium">مشتری</h2>
            <p className="mt-3 text-sm">
              {order.customer?.name ?? order.walkInCustomerName ?? "—"}
            </p>
            {order.customer?.email &&
              !order.customer.email.endsWith("@phone.nikia.local") && (
                <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                  {order.customer.email}
                </p>
              )}
            {!order.customer && order.walkInCustomerName && (
              <p className="mt-1 text-xs text-muted-foreground">
                بدون حساب کاربری — فقط برای این فاکتور ثبت شده
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border p-6">
            <h2 className="text-sm font-medium">آدرس تحویل</h2>
            {order.address ? (
              <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
                <span className="text-foreground">
                  نام و نام خانوادگی: {order.address.fullName}
                </span>
                <span className="text-right" dir="ltr">
                  شماره تماس: {order.address.phone}
                </span>
                <span>
                  استان و شهر: {order.address.province}، {order.address.city}
                </span>
                <span>آدرس: {order.address.addressLine}</span>
                <span>
                  کد پستی:
                  <span className="">{order.address.postalCode}</span>
                </span>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {order.source === "IN_PERSON"
                  ? "خرید حضوری — نیازی به آدرس ارسال نبوده."
                  : "آدرسی ثبت نشده است."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
