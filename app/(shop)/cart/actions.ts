"use server";

import { prisma } from "@/lib/db";
import { validateDiscountCode, type DiscountValidationResult } from "@/lib/discount";

export type CartValidationItem = { productId: string; variantId: string };

export type CartItemStatus = {
  variantId: string;
  /** false if the product no longer exists, is unpublished/archived, or
   * the specific variant itself was removed. */
  available: boolean;
  /** Current price straight from the database. */
  price: number;
  /** Current stock for this exact variant. A product with no variants is
   * treated as unlimited, matching checkout. */
  stock: number;
  name: string;
};

const UNLIMITED_STOCK = 99;

/** Re-checks a cart against the database: price, availability, stock. */
export async function getCartItemsStatus(
  items: CartValidationItem[],
): Promise<CartItemStatus[]> {
  if (items.length === 0 || items.length > 60) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set(items.map((i) => i.productId))] } },
    select: {
      id: true,
      name: true,
      price: true,
      isPublished: true,
      isArchived: true,
      variants: { select: { id: true, stock: true } },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return items.map((item): CartItemStatus => {
    const product = byId.get(item.productId);
    const gone = { variantId: item.variantId, available: false, price: 0, stock: 0, name: product?.name ?? "" };
    if (!product || !product.isPublished || product.isArchived) return gone;

    if (product.variants.length === 0) {
      // Placeholder-variant product (variantId === product.id): nothing to run out of.
      return item.variantId === product.id
        ? { variantId: item.variantId, available: true, price: product.price, stock: UNLIMITED_STOCK, name: product.name }
        : gone;
    }
    const variant = product.variants.find((v) => v.id === item.variantId);
    if (!variant) return gone;
    return { variantId: item.variantId, available: true, price: product.price, stock: variant.stock, name: product.name };
  });
}

/** Thin wrapper — the rules live in lib/discount.ts, shared with checkout. */
export async function applyDiscountCode(
  code: string,
  subtotal: number,
): Promise<DiscountValidationResult> {
  if (typeof code !== "string" || code.length > 40) {
    return { valid: false, error: "کد تخفیف معتبر نیست." };
  }
  return validateDiscountCode(code, subtotal);
}
