import type { Prisma } from "@/lib/generated/prisma";

/**
 * Recomputes and persists Product.inStock from its variants' current
 * stock levels. Call this after anything that can change stock:
 *   - saving the admin product form (app/admin/products/actions.ts)
 *   - reserving stock at checkout (app/(shop)/checkout/actions.ts)
 *   - releasing stock back after a failed payment (same file)
 *
 * Takes `Prisma.TransactionClient` rather than `typeof prisma` — that's
 * the type both the main client and a `tx` handle from inside
 * `prisma.$transaction(async (tx) => ...)` actually satisfy. The full
 * client has a few extra methods (`$connect`, `$disconnect`, etc.) that
 * a transaction handle doesn't, so typing this as the full client type
 * rejects `tx` at the call site inside the checkout transaction.
 */
export async function syncProductInStock(
  client: Prisma.TransactionClient,
  productId: string,
): Promise<void> {
  const variants = (await client.productVariant.findMany({
    where: { productId },
    select: { stock: true },
  })) as { stock: number }[];

  // A product with no variants at all (a "simple" product) has nothing
  // to be out of stock of, by this app's convention.
  const inStock = variants.length === 0 || variants.some((v) => v.stock > 0);

  await client.product.update({
    where: { id: productId },
    data: { inStock },
  });
}
