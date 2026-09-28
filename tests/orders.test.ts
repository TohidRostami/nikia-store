import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { ADDRESS, reset, type Ctx } from "./fixtures";
import { createOrder } from "@/lib/orders/create-order";
import {
  closeOrder,
  expireStaleOrders,
  failPendingOrder,
  markOrderPaid,
  PENDING_ORDER_TTL_MS,
} from "@/lib/orders/lifecycle";
import { evaluateDiscount } from "@/lib/discount";

let ctx: Ctx;
beforeEach(async () => {
  ctx = await reset();
});

const order = (
  c: Ctx,
  quantity = 1,
  extra: { discountCode?: string | null; variantId?: string; productId?: string } = {},
) =>
  createOrder({
    userId: c.userId,
    items: [{ productId: extra.productId ?? c.productId, variantId: extra.variantId ?? c.variantId, quantity }],
    address: ADDRESS,
    discountCode: extra.discountCode,
  });

const stock = async (c: Ctx) =>
  (await prisma.productVariant.findUniqueOrThrow({ where: { id: c.variantId } })).stock;

describe("createOrder — input validation", () => {
  it.each([-5, 0, 1.5, 11])("rejects quantity %s", async (q) => {
    const r = await order(ctx, q);
    expect(r.ok).toBe(false);
    expect(await stock(ctx)).toBe(3);
    expect(await prisma.order.count()).toBe(0);
  });

  it("rejects an empty cart and a bad address", async () => {
    expect((await createOrder({ userId: ctx.userId, items: [], address: ADDRESS })).ok).toBe(false);
    const bad = await createOrder({
      userId: ctx.userId,
      items: [{ productId: ctx.productId, variantId: ctx.variantId, quantity: 1 }],
      address: { ...ADDRESS, postalCode: "123" },
    });
    expect(bad.ok).toBe(false);
  });

  it("does not let the same variant sent twice bypass the per-line cap", async () => {
    const r = await createOrder({
      userId: ctx.userId,
      items: [
        { productId: ctx.productId, variantId: ctx.variantId, quantity: 6 },
        { productId: ctx.productId, variantId: ctx.variantId, quantity: 6 },
      ],
      address: ADDRESS,
    });
    expect(r.ok).toBe(false);
  });

  it("rejects unpublished and archived products", async () => {
    await prisma.product.update({ where: { id: ctx.productId }, data: { isPublished: false } });
    expect((await order(ctx)).ok).toBe(false);
    await prisma.product.update({ where: { id: ctx.productId }, data: { isPublished: true, isArchived: true } });
    expect((await order(ctx)).ok).toBe(false);
  });

  it("rejects a variant that belongs to no product in the cart", async () => {
    const r = await order(ctx, 1, { variantId: "does-not-exist" });
    expect(r.ok).toBe(false);
  });
});

describe("createOrder — pricing and stock", () => {
  it("prices from the database, adds shipping below the free threshold, and normalises the phone", async () => {
    const r = await order(ctx, 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const saved = await prisma.order.findUniqueOrThrow({
      where: { id: r.order.id },
      include: { items: true, address: true },
    });
    expect(saved.subtotal).toBe(1_000_000);
    expect(saved.shippingCost).toBe(60_000);
    expect(saved.total).toBe(1_060_000);
    expect(saved.status).toBe("PENDING_PAYMENT");
    expect(saved.items[0]).toMatchObject({ name: "مانتو", size: "40", color: "کرم", price: 1_000_000 });
    expect(saved.address?.phone).toBe("09121234567");
    expect(saved.orderNumber).toMatch(/^\d{14}$/);
    expect(await stock(ctx)).toBe(2);
  });

  it("ships free at or above the threshold", async () => {
    await prisma.productVariant.update({ where: { id: ctx.variantId }, data: { stock: 5 } });
    const r = await order(ctx, 2);
    expect(r.ok && r.order.total).toBe(2_000_000);
  });

  it("refuses to oversell and leaves nothing half-reserved", async () => {
    const r = await order(ctx, 4);
    expect(r.ok).toBe(false);
    expect(await stock(ctx)).toBe(3);
    expect(await prisma.order.count()).toBe(0);
  });

  it("only one of two simultaneous checkouts gets the last units", async () => {
    await prisma.productVariant.update({ where: { id: ctx.variantId }, data: { stock: 3 } });
    const [a, b] = await Promise.all([order(ctx, 2), order(ctx, 2)]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    expect(await stock(ctx)).toBe(1);
  });

  it("flags the product out of stock when the last unit is taken", async () => {
    await order(ctx, 3);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: ctx.productId } })).inStock).toBe(false);
  });

  it("orders a product without variants (no foreign-key error, unlimited stock)", async () => {
    const r = await createOrder({
      userId: ctx.userId,
      items: [{ productId: ctx.simpleProductId, variantId: ctx.simpleProductId, quantity: 2 }],
      address: ADDRESS,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const item = await prisma.orderItem.findFirstOrThrow({ where: { orderId: r.order.id } });
    expect(item.variantId).toBeNull();
  });

  it("reuses an identical saved address instead of duplicating it", async () => {
    await order(ctx, 1);
    await order(ctx, 1);
    expect(await prisma.address.count()).toBe(1);
  });
});

describe("discount codes", () => {
  it("applies a percentage code and counts the use", async () => {
    await prisma.discountCode.create({ data: { code: "NIKIA10", type: "PERCENTAGE", value: 10 } });
    const r = await order(ctx, 1, { discountCode: " nikia10 " });
    expect(r.ok).toBe(true);
    const saved = await prisma.order.findFirstOrThrow();
    expect(saved.discountAmount).toBe(100_000);
    expect(saved.total).toBe(1_000_000 + 60_000 - 100_000);
    expect((await prisma.discountCode.findUniqueOrThrow({ where: { code: "NIKIA10" } })).usedCount).toBe(1);
  });

  it("rejects an unknown code without reserving stock", async () => {
    const r = await order(ctx, 1, { discountCode: "NOPE" });
    expect(r.ok).toBe(false);
    expect(await stock(ctx)).toBe(3);
  });

  it("a single-use code can be claimed only once, even by two simultaneous checkouts", async () => {
    await prisma.discountCode.create({ data: { code: "ONCE", type: "FIXED", value: 50_000, maxUses: 1 } });
    const [a, b] = await Promise.all([
      order(ctx, 1, { discountCode: "ONCE" }),
      order(ctx, 1, { discountCode: "ONCE" }),
    ]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    // The loser's stock reservation was rolled back with it.
    expect(await stock(ctx)).toBe(2);
  });

  it("evaluateDiscount honours expiry, minimum and inactive flags", () => {
    const base = { id: "1", code: "X", type: "FIXED" as const, value: 10, maxUses: null, usedCount: 0, minOrderTotal: null, expiresAt: null, isActive: true };
    expect(evaluateDiscount(base, 100).valid).toBe(true);
    expect(evaluateDiscount({ ...base, isActive: false }, 100).valid).toBe(false);
    expect(evaluateDiscount({ ...base, expiresAt: new Date(Date.now() - 1000) }, 100).valid).toBe(false);
    expect(evaluateDiscount({ ...base, minOrderTotal: 500 }, 100).valid).toBe(false);
    expect(evaluateDiscount({ ...base, maxUses: 1, usedCount: 1 }, 100).valid).toBe(false);
  });
});

describe("order lifecycle", () => {
  async function pending(code?: string) {
    const r = await order(ctx, 2, { discountCode: code });
    if (!r.ok) throw new Error(r.error);
    return r.order.id;
  }

  it("a failed payment puts stock and the discount use back — exactly once", async () => {
    await prisma.discountCode.create({ data: { code: "D", type: "FIXED", value: 1000 } });
    const id = await pending("D");
    expect(await stock(ctx)).toBe(1);

    expect(await failPendingOrder(id)).toBe(true);
    expect(await failPendingOrder(id)).toBe(false); // second call is a no-op
    expect(await stock(ctx)).toBe(3);
    expect((await prisma.discountCode.findUniqueOrThrow({ where: { code: "D" } })).usedCount).toBe(0);
    expect((await prisma.order.findUniqueOrThrow({ where: { id } })).status).toBe("CANCELLED");
  });

  it("markOrderPaid is idempotent and stores the bank reference", async () => {
    const id = await pending();
    expect(await markOrderPaid(id, "REF1")).toBe("paid");
    expect(await markOrderPaid(id, "REF2")).toBe("already-paid");
    const saved = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(saved.status).toBe("PAID");
    expect(saved.paymentRefId).toBe("REF1");
    expect(saved.paidAt).not.toBeNull();
    // A late failure notice must not cancel a paid order.
    expect(await failPendingOrder(id)).toBe(false);
  });

  it("a payment verified after expiry still honours the order", async () => {
    const id = await pending();
    await failPendingOrder(id);
    expect(await stock(ctx)).toBe(3);
    expect(await markOrderPaid(id, "LATE")).toBe("paid");
    expect((await prisma.order.findUniqueOrThrow({ where: { id } })).status).toBe("PAID");
    expect(await stock(ctx)).toBe(1);
  });

  it("refunding a paid order returns its stock", async () => {
    const id = await pending();
    await markOrderPaid(id);
    expect(await closeOrder(id, { from: ["PAID"], to: "REFUNDED" })).toBe(true);
    expect(await stock(ctx)).toBe(3);
  });

  it("expireStaleOrders cancels only unpaid orders past the window", async () => {
    const stale = await pending(); // 2 units
    const paidResult = await order(ctx, 1); // last unit
    if (!paidResult.ok) throw new Error(paidResult.error);
    await markOrderPaid(paidResult.order.id);

    // Both are old, but only the unpaid one may be cancelled.
    const old = new Date(Date.now() - PENDING_ORDER_TTL_MS - 60_000);
    await prisma.order.updateMany({ data: { createdAt: old } });

    expect(await expireStaleOrders()).toBe(1);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: stale } })).status).toBe("CANCELLED");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: paidResult.order.id } })).status).toBe("PAID");
    expect(await stock(ctx)).toBe(2); // the 2 stale units came back, the paid unit stays sold
  });

  it("starting a new checkout releases the customer's own abandoned unpaid order", async () => {
    const first = await pending(); // takes 2 of the 3 units
    await prisma.order.update({
      where: { id: first },
      data: { createdAt: new Date(Date.now() - 5 * 60_000) },
    });
    // Without the release this would fail: only 1 unit would be left.
    const second = await order(ctx, 3);
    expect(second.ok).toBe(true);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: first } })).status).toBe("CANCELLED");
  });

  it("leaves a recent unpaid order alone", async () => {
    const id = await pending();
    expect(await expireStaleOrders()).toBe(0);
    expect((await prisma.order.findUniqueOrThrow({ where: { id } })).status).toBe("PENDING_PAYMENT");
  });
});
