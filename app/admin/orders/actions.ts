"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { closeOrder } from "@/lib/orders/lifecycle";
import type { OrderStatus } from "@/lib/generated/prisma";

const VALID_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

// Once an order is cancelled or refunded its stock has gone back on the
// shelf, so it can't be quietly "un-cancelled" — that would sell the same
// units twice. Create a new order instead (e.g. through خرید حضوری).
const TERMINAL: OrderStatus[] = ["CANCELLED", "REFUNDED"];

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  if (!VALID_STATUSES.includes(status as OrderStatus)) return { error: "وضعیت نامعتبر است." };
  const next = status as OrderStatus;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  if (!order) return { error: "سفارش پیدا نشد." };
  if (order.status === next) return { success: true as const };

  if (TERMINAL.includes(order.status)) {
    return {
      error: "سفارش لغو یا بازگردانده‌شده را نمی‌توان دوباره فعال کرد؛ موجودی آن قبلاً به انبار برگشته است.",
    };
  }

  if (next === "CANCELLED" || next === "REFUNDED") {
    // Goes through the same code as a failed payment: stock (and, for a
    // cancellation, the discount use) is returned exactly once.
    const closed = await closeOrder(orderId, { from: [order.status], to: next });
    if (!closed) return { error: "وضعیت سفارش هم‌زمان تغییر کرد؛ صفحه را بازخوانی کنید." };
  } else {
    // Conditional on the status we just read, so two admins can't overwrite each other blindly.
    const moved = await prisma.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: next,
        ...(next === "PAID" && order.status === "PENDING_PAYMENT" ? { paidAt: new Date() } : {}),
      },
    });
    if (moved.count === 0) return { error: "وضعیت سفارش هم‌زمان تغییر کرد؛ صفحه را بازخوانی کنید." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { success: true as const };
}
