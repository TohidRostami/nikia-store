import { prisma } from "@/lib/db";
import { syncProductInStock } from "@/lib/inventory";
import type { OrderStatus, Prisma } from "@/lib/generated/prisma";

type Tx = Prisma.TransactionClient;

/**
 * How long an unpaid order may keep its stock reserved. Deliberately much
 * longer than a payment-gateway session (~15 minutes), so a customer who is
 * still paying is never cancelled underneath.
 */
export const PENDING_ORDER_TTL_MS = 60 * 60 * 1000;

/** Puts every reserved unit of an order back on the shelf. */
export async function releaseOrderStock(tx: Tx, orderId: string): Promise<void> {
  const items = await tx.orderItem.findMany({
    where: { orderId, variantId: { not: null } },
    select: { productId: true, variantId: true, quantity: true },
  });

  for (const item of items) {
    await tx.productVariant.updateMany({
      where: { id: item.variantId! },
      data: { stock: { increment: item.quantity }, version: { increment: 1 } },
    });
  }
  for (const productId of new Set(items.map((i) => i.productId))) {
    await syncProductInStock(tx, productId);
  }
}

/**
 * Moves an order to a terminal "stock goes back" status (CANCELLED or
 * REFUNDED) exactly once. The status change is a conditional update, so
 * if two things race (say the payment callback and the expiry job) only
 * one of them wins and the stock is released a single time.
 *
 * Returns false when the order wasn't in one of the `from` statuses.
 */
export async function closeOrder(
  orderId: string,
  opts: { from: OrderStatus[]; to: "CANCELLED" | "REFUNDED" },
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const moved = await tx.order.updateMany({
      where: { id: orderId, status: { in: opts.from } },
      data: { status: opts.to },
    });
    if (moved.count === 0) return false;

    await releaseOrderStock(tx, orderId);

    // A cancelled order never "used" its discount code. (A refund after
    // delivery did, so REFUNDED keeps the count.)
    if (opts.to === "CANCELLED") {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { discountCodeId: true },
      });
      if (order?.discountCodeId) {
        await tx.discountCode.updateMany({
          where: { id: order.discountCodeId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }
    }
    return true;
  });
}

/** A payment that didn't go through: cancel the order and free its stock. */
export function failPendingOrder(orderId: string) {
  return closeOrder(orderId, { from: ["PENDING_PAYMENT"], to: "CANCELLED" });
}

export type MarkPaidResult = "paid" | "already-paid" | "missing";

/**
 * Records a verified payment. Idempotent: gateways may call back more than
 * once, and a customer can refresh the callback URL.
 */
export async function markOrderPaid(
  orderId: string,
  paymentRefId?: string,
): Promise<MarkPaidResult> {
  const moved = await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING_PAYMENT" },
    data: { status: "PAID", paidAt: new Date(), paymentRefId: paymentRefId ?? null },
  });
  if (moved.count === 1) return "paid";

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  if (!order) return "missing";

  if (order.status === "CANCELLED") {
    // The money was verified after the order had already been cancelled
    // (only possible if the customer sat on the gateway page for longer
    // than PENDING_ORDER_TTL_MS). The customer has paid, so honour the
    // order and take the stock again, clamped at zero, rather than
    // silently keeping the money for a cancelled order.
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID", paidAt: new Date(), paymentRefId: paymentRefId ?? null },
      });
      const items = await tx.orderItem.findMany({
        where: { orderId, variantId: { not: null } },
        select: { productId: true, variantId: true, quantity: true },
      });
      for (const item of items) {
        const v = await tx.productVariant.findUnique({ where: { id: item.variantId! } });
        if (!v) continue;
        await tx.productVariant.update({
          where: { id: v.id },
          data: { stock: Math.max(0, v.stock - item.quantity), version: { increment: 1 } },
        });
      }
      for (const productId of new Set(items.map((i) => i.productId))) {
        await syncProductInStock(tx, productId);
      }
    });
    return "paid";
  }
  return "already-paid";
}

/** Cancels unpaid orders that outlived the reservation window. */
export async function expireStaleOrders(now = new Date(), limit = 25): Promise<number> {
  const stale = await prisma.order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      createdAt: { lt: new Date(now.getTime() - PENDING_ORDER_TTL_MS) },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let expired = 0;
  for (const { id } of stale) {
    if (await failPendingOrder(id)) expired++;
  }
  return expired;
}
