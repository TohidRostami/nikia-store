import Link from "next/link";
import { ORDER_STATUS_LABELS, ORDER_STATUS_PILL } from "@/lib/order-status";
import { formatToman, toPersianDigits } from "@/lib/format";
import { formatJalali } from "@/lib/date";
import type { CustomerOrderSummary } from "@/lib/queries/orders";

export function OrderRow({ order }: { order: CustomerOrderSummary }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#e2dace] bg-white px-5 py-[18px]">
      <div className="flex min-w-[140px] flex-col gap-1.5">
        <b className="text-sm font-semibold">
          سفارش <span className="font-nums">{toPersianDigits(order.orderNumber)}</span>
        </b>
        <span className="text-xs text-muted-foreground">
          {formatJalali(order.createdAt)} · {toPersianDigits(order.itemCount)} کالا
        </span>
      </div>
      <span className={`rounded-full px-3 py-1.5 text-xs ${ORDER_STATUS_PILL[order.status] ?? "bg-sand"}`}>
        {ORDER_STATUS_LABELS[order.status] ?? order.status}
      </span>
      <span className="text-sm font-medium">{formatToman(order.total)}</span>
      <Link
        href={`/account/orders/${order.id}`}
        className="rounded-sm border border-ink px-4 py-2 text-[13px] transition-colors hover:bg-ink hover:text-paper"
      >
        جزئیات
      </Link>
    </div>
  );
}
