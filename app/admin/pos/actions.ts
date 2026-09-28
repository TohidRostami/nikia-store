"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminOrSubAdmin } from "@/lib/require-admin";
import { syncProductInStock } from "@/lib/inventory";
import { generateOrderNumber } from "@/lib/order-number";
import {
  searchProductsForPos,
  searchCustomersForPos,
  type PosProductResult,
  type PosCustomerResult,
} from "@/lib/queries/admin-pos";

export async function searchProducts(
  query: string,
): Promise<PosProductResult[]> {
  await requireAdminOrSubAdmin();
  return searchProductsForPos(query);
}

export async function searchCustomers(
  query: string,
): Promise<PosCustomerResult[]> {
  await requireAdminOrSubAdmin();
  return searchCustomersForPos(query);
}

export type PosOrderItemInput = {
  productId: string;
  // null only for a "simple" product with no color/size variants at all.
  variantId: string | null;
  name: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
};

export type CreateInPersonOrderInput = {
  items: PosOrderItemInput[];
  customerUserId: string | null;
  walkInCustomerName: string | null;
};

export type CreateInPersonOrderResult =
  | { error: string }
  | { success: true; orderId: string; orderNumber: string };

export async function createInPersonOrder(
  input: CreateInPersonOrderInput,
): Promise<CreateInPersonOrderResult> {
  await requireAdminOrSubAdmin();

  if (input.items.length === 0) {
    return { error: "حداقل یک کالا باید به فاکتور اضافه شود." };
  }
  // Doesn't require an *account* — a plain typed name is enough — but
  // some identifier is mandatory, so a walk-in sale can't be recorded
  // completely anonymously.
  if (!input.customerUserId && !input.walkInCustomerName?.trim()) {
    return { error: "نام مشتری الزامی است (نیازی به داشتن حساب کاربری نیست)." };
  }
  for (const item of input.items) {
    if (item.price < 0)
      return { error: `قیمت «${item.name}» نمی‌تواند منفی باشد.` };
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 500)
      return { error: `تعداد «${item.name}» باید یک عدد صحیح بین ۱ تا ۵۰۰ باشد.` };
    if (!Number.isInteger(item.price))
      return { error: `قیمت «${item.name}» باید عدد صحیح (تومان) باشد.` };
  }

  const subtotal = input.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );

  // Only items that resolved to a *real* variant get stock reserved —
  // same convention as online checkout (see checkout/actions.ts).
  const stockReservations = input.items
    .filter(
      (i): i is PosOrderItemInput & { variantId: string } =>
        i.variantId !== null,
    )
    .map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
      name: i.name,
    }));

  let orderId: string;
  let orderNumber: string;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Same all-or-nothing, version-guarded reservation as the real
      // checkout flow — an in-person sale can't oversell a unit any
      // more than an online one can.
      for (const reservation of stockReservations) {
        const variant = await tx.productVariant.findUnique({
          where: { id: reservation.variantId },
        });
        if (!variant) {
          throw new Error(
            `یکی از اقلام («${reservation.name}») دیگر در دسترس نیست.`,
          );
        }
        if (variant.stock < reservation.quantity) {
          throw new Error(
            `موجودی «${reservation.name}» کافی نیست (موجودی فعلی: ${variant.stock}).`,
          );
        }
        const updated = await tx.productVariant.updateMany({
          where: { id: reservation.variantId, version: variant.version },
          data: {
            stock: { decrement: reservation.quantity },
            version: { increment: 1 },
          },
        });
        if (updated.count === 0) {
          throw new Error(
            `موجودی «${reservation.name}» هم‌زمان تغییر کرد — لطفاً دوباره تلاش کنید.`,
          );
        }
      }

      const affectedProductIds = new Set(input.items.map((i) => i.productId));
      for (const productId of affectedProductIds) {
        await syncProductInStock(tx, productId);
      }

      // Paid immediately — the actual payment already happened on the
      // store's card reader; this is just recording that it did.
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          // Prisma's create-input types want optional relation-scalar
          // fields (userId/addressId) either provided or *omitted*
          // (`undefined`) — not explicitly `null`, even though the
          // column itself is nullable. `?? undefined` here (and simply
          // leaving addressId out below) satisfies that.
          userId: input.customerUserId ?? undefined,
          source: "IN_PERSON",
          walkInCustomerName: input.customerUserId
            ? null
            : input.walkInCustomerName?.trim() || null,
          status: "PAID",
          paidAt: new Date(),
          subtotal,
          shippingCost: 0,
          total: subtotal,
        },
      });

      for (const item of input.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            size: item.size,
            color: item.color,
            price: item.price,
            quantity: item.quantity,
          },
        });
      }

      return { id: order.id, orderNumber: order.orderNumber };
    });

    orderId = result.id;
    orderNumber = result.orderNumber;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "خطا در ثبت فاکتور." };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { success: true, orderId, orderNumber };
}
