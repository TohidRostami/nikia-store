import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import { formatJalali } from "@/lib/date";
import { formatToman, toPersianDigits } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_PILL } from "@/lib/order-status";
import { getOrderForCustomer } from "@/lib/queries/orders";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "جزئیات سفارش", robots: { index: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser(`/account/orders/${id}`);
  const order = await getOrderForCustomer(id, session.user.id);
  if (!order) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Link href="/account/orders" className="text-xs text-muted-foreground hover:text-ink">
            → سفارش‌های من
          </Link>
          <h1 className="text-[clamp(22px,3vw,30px)] font-normal">
            سفارش <span className="font-nums">{toPersianDigits(order.orderNumber)}</span>
          </h1>
          <span className="text-xs text-muted-foreground">ثبت‌شده در {formatJalali(order.createdAt)}</span>
        </div>
        <span className={`rounded-full px-3.5 py-1.5 text-xs ${ORDER_STATUS_PILL[order.status] ?? "bg-sand"}`}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {order.status === "PENDING_PAYMENT" && (
        <p className="rounded-md bg-sand px-4 py-3 text-[13px] leading-8 text-body">
          پرداخت این سفارش هنوز تأیید نشده است. اگر مبلغ از حساب شما کسر شده، تا چند دقیقه دیگر وضعیت به‌روز می‌شود؛ در غیر این صورت سفارش خودکار لغو می‌شود.
        </p>
      )}

      <div className="flex flex-col rounded-lg border border-[#e2dace] bg-white">
        {order.items.map((i) => (
          <div key={i.id} className="flex items-center gap-4 border-b border-hairline p-4 last:border-b-0">
            <div className="relative h-[84px] w-[68px] shrink-0 overflow-hidden rounded-sm bg-sand">
              {i.image ? <Image src={i.image} alt="" fill sizes="68px" className="object-cover" /> : <ProductPlaceholder />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {i.productSlug ? (
                <Link href={`/products/${i.productSlug}`} className="text-sm font-medium hover:underline">
                  {i.name}
                </Link>
              ) : (
                <span className="text-sm font-medium">{i.name}</span>
              )}
              <span className="text-xs text-muted-foreground">
                {[i.color && `رنگ: ${i.color}`, i.size && `سایز: ${toPersianDigits(i.size)}`, `${toPersianDigits(i.quantity)} عدد`].filter(Boolean).join(" · ")}
              </span>
            </div>
            <span className="text-sm">{formatToman(i.price * i.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {order.address && (
          <div className="flex flex-col gap-2 rounded-lg border border-[#e2dace] bg-white p-5 text-[13px] leading-[2]">
            <b className="text-sm font-semibold">آدرس تحویل</b>
            <span>
              {order.address.fullName} · <span className="font-nums">{toPersianDigits(order.address.phone)}</span>
            </span>
            <span className="text-body">
              {order.address.province}، {order.address.city}، {order.address.addressLine}
            </span>
            <span className="text-muted-foreground">کد پستی {toPersianDigits(order.address.postalCode)}</span>
          </div>
        )}
        <div className="flex flex-col gap-2.5 rounded-lg border border-[#e2dace] bg-white p-5 text-[13px]">
          <b className="text-sm font-semibold">خلاصه پرداخت</b>
          <div className="flex justify-between">
            <span className="text-body">جمع کالاها</span>
            <span>{formatToman(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sale">
              <span>تخفیف{order.discountCode ? ` (${order.discountCode})` : ""}</span>
              <span>−{formatToman(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-body">هزینه ارسال</span>
            <span>{order.shippingCost === 0 ? "رایگان" : formatToman(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-2.5 text-[15px] font-semibold">
            <span>مبلغ کل</span>
            <span>{formatToman(order.total)}</span>
          </div>
          {order.paymentRefId && (
            <span className="text-xs text-muted-foreground">
              کد پیگیری بانک: <span className="font-nums">{order.paymentRefId}</span>
            </span>
          )}
        </div>
      </div>
    </>
  );
}
