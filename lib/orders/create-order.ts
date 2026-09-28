import { z } from "zod";
import { prisma } from "@/lib/db";
import { addressSchema } from "@/lib/address";
import { evaluateDiscount, normalizeDiscountCode, type DiscountRow } from "@/lib/discount";
import { syncProductInStock } from "@/lib/inventory";
import { generateOrderNumber } from "@/lib/order-number";
import { getSiteSettings } from "@/lib/queries/settings";
import { expireStaleOrders, failPendingOrder } from "@/lib/orders/lifecycle";
import { formatPrice } from "@/lib/format";
import { calcShipping } from "@/lib/shipping";
import { MAX_LINE_QUANTITY } from "@/lib/product-constants";
import { Prisma } from "@/lib/generated/prisma";

/** Payment gateways reject tiny amounts. */
export const MIN_PAYABLE_TOMAN = 1000;

export const checkoutItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(64),
      variantId: z.string().min(1).max(64),
      quantity: z.number().int("تعداد باید عدد صحیح باشد.").min(1).max(MAX_LINE_QUANTITY),
    }),
  )
  .min(1, "سبد خرید خالی است.")
  .max(40);

export type CreatedOrder = {
  id: string;
  orderNumber: string;
  total: number;
  userName: string | null;
};

export type CreateOrderResult =
  | { ok: true; order: CreatedOrder }
  | { ok: false; error: string };

/** A failure the customer should see, as opposed to an unexpected crash. */
class OrderError extends Error {}

/**
 * Turns a cart into an unpaid order, atomically.
 *
 * Nothing the browser sends is trusted for money: prices, names, size and
 * color labels, shipping and the discount all come from the database.
 * Stock is reserved with a conditional decrement (`stock >= qty`), so two
 * checkouts can never both take the last unit; the reservation, discount
 * usage, address and order rows all commit together or not at all.
 *
 * The caller (a server action) is responsible for authentication and
 * passes the verified `userId`.
 */
export async function createOrder(params: {
  userId: string;
  items: unknown;
  address: unknown;
  discountCode?: string | null;
}): Promise<CreateOrderResult> {
  const itemsParsed = checkoutItemsSchema.safeParse(params.items);
  if (!itemsParsed.success) {
    return { ok: false, error: itemsParsed.error.issues[0]?.message ?? "سبد خرید نامعتبر است." };
  }
  const addressParsed = addressSchema.safeParse(params.address);
  if (!addressParsed.success) {
    return { ok: false, error: addressParsed.error.issues[0]?.message ?? "آدرس نامعتبر است." };
  }
  const address = addressParsed.data;

  // The same variant sent twice must not slip past the per-line cap.
  const merged = new Map<string, { productId: string; variantId: string; quantity: number }>();
  for (const item of itemsParsed.data) {
    const key = `${item.productId}:${item.variantId}`;
    const prev = merged.get(key);
    merged.set(key, { ...item, quantity: (prev?.quantity ?? 0) + item.quantity });
  }
  const items = [...merged.values()];
  if (items.some((i) => i.quantity > MAX_LINE_QUANTITY)) {
    return { ok: false, error: `حداکثر ${formatPrice(MAX_LINE_QUANTITY)} عدد از هر کالا را می‌توانید سفارش دهید.` };
  }

  // Unpaid orders past their window give their stock back before we try to
  // reserve any — cheap, indexed, and keeps the shelf honest without a cron.
  await expireStaleOrders().catch(() => 0);

  // Starting a new checkout means the customer walked away from an earlier
  // unpaid attempt (closed the bank page, hit "back"). Release what that
  // attempt still holds — otherwise they could be refused a size because
  // *their own* abandoned order is sitting on the last unit. The one-minute
  // grace period keeps a just-created order safe from a double submit.
  const abandoned = await prisma.order.findMany({
    where: {
      userId: params.userId,
      status: "PENDING_PAYMENT",
      createdAt: { lt: new Date(Date.now() - 60_000) },
    },
    select: { id: true },
    take: 10,
  });
  for (const { id } of abandoned) await failPendingOrder(id).catch(() => false);

  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set(items.map((i) => i.productId))] }, isPublished: true, isArchived: false },
    include: { variants: { include: { size: true, color: true } } },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  type Line = {
    productId: string;
    variantId: string | null;
    name: string;
    size: string | null;
    color: string | null;
    price: number;
    quantity: number;
  };
  const lines: Line[] = [];
  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product) {
      return { ok: false, error: "یکی از محصولات سبد خرید دیگر در دسترس نیست." };
    }

    let variant: (typeof product.variants)[number] | null = null;
    if (product.variants.length > 0) {
      variant = product.variants.find((v) => v.id === item.variantId) ?? null;
      if (!variant) {
        return { ok: false, error: `گزینه‌ی انتخاب‌شده برای «${product.name}» دیگر موجود نیست.` };
      }
    } else if (item.variantId !== product.id) {
      // A product without variants uses its own id as the cart's placeholder variantId.
      return { ok: false, error: "سبد خرید نامعتبر است." };
    }

    lines.push({
      productId: product.id,
      // Only a real variant may be stored — OrderItem.variantId is a foreign key.
      variantId: variant?.id ?? null,
      name: product.name,
      size: variant?.size?.name ?? null,
      color: variant?.color?.name ?? null,
      price: product.price,
      quantity: item.quantity,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const settings = await getSiteSettings();
  const shippingCost = calcShipping(subtotal, settings);
  const codeText = params.discountCode ? normalizeDiscountCode(params.discountCode) : "";

  const attempt = () =>
    prisma.$transaction(
      async (tx) => {
        // 1) Reserve stock — one atomic conditional decrement per variant.
        for (const line of lines) {
          if (!line.variantId) continue;
          const reserved = await tx.productVariant.updateMany({
            where: { id: line.variantId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity }, version: { increment: 1 } },
          });
          if (reserved.count === 0) {
            throw new OrderError(`موجودی «${line.name}» کافی نیست.`);
          }
        }
        for (const productId of new Set(lines.map((l) => l.productId))) {
          await syncProductInStock(tx, productId);
        }

        // 2) Discount — validated against fresh data inside the transaction,
        //    then consumed with an optimistic lock on usedCount so the last
        //    remaining use can't be claimed twice.
        let discountAmount = 0;
        let discountCodeId: string | null = null;
        if (codeText) {
          const row = await tx.discountCode.findUnique({ where: { code: codeText } });
          const result = evaluateDiscount(row as DiscountRow | null, subtotal);
          if (!result.valid) throw new OrderError(result.error);
          const consumed = await tx.discountCode.updateMany({
            where: { id: result.id, usedCount: row!.usedCount },
            data: { usedCount: { increment: 1 } },
          });
          if (consumed.count === 0) {
            throw new OrderError("کد تخفیف هم‌زمان توسط کاربر دیگری استفاده شد؛ دوباره تلاش کنید.");
          }
          discountAmount = result.discountAmount;
          discountCodeId = result.id;
        }

        const total = subtotal + shippingCost - discountAmount;
        if (total < MIN_PAYABLE_TOMAN) {
          throw new OrderError(`مبلغ قابل پرداخت باید حداقل ${formatPrice(MIN_PAYABLE_TOMAN)} تومان باشد.`);
        }

        // 3) Address — reuse an identical saved one instead of piling up duplicates.
        const { isDefault: _ignored, ...addressData } = address;
        void _ignored;
        const existing = await tx.address.findFirst({
          where: { userId: params.userId, ...addressData },
          select: { id: true },
        });
        const addressId =
          existing?.id ??
          (
            await tx.address.create({
              data: {
                ...addressData,
                userId: params.userId,
                isDefault: (await tx.address.count({ where: { userId: params.userId } })) === 0,
              },
              select: { id: true },
            })
          ).id;

        // 4) The order itself.
        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId: params.userId,
            addressId,
            subtotal,
            discountAmount,
            discountCodeId,
            shippingCost,
            total,
            items: { create: lines },
          },
          select: { id: true, orderNumber: true, total: true, user: { select: { name: true } } },
        });
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          userName: order.user?.name ?? null,
        } satisfies CreatedOrder;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

  try {
    // An order-number collision (1 in a million per pair) just retries.
    for (let i = 0; ; i++) {
      try {
        return { ok: true, order: await attempt() };
      } catch (e) {
        const collision =
          e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && i < 2;
        if (!collision) throw e;
      }
    }
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error("[createOrder] unexpected failure:", e);
    return { ok: false, error: "ثبت سفارش با خطا مواجه شد. لطفاً دوباره تلاش کنید." };
  }
}
