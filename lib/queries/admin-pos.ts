import { prisma } from "@/lib/db";

export type PosProductVariant = {
  id: string;
  sizeId: string | null;
  sizeName: string | null;
  colorId: string | null;
  stock: number;
};

export type PosProductResult = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  colors: { id: string; name: string; hexValue: string | null }[];
  variants: PosProductVariant[];
};

/**
 * Product search for the in-person purchase (POS) admin page — matches
 * by name OR sku (product code). Only published, non-archived products,
 * same as the storefront, since a walk-in sale shouldn't be able to
 * ring up something that's been pulled from sale.
 */
export async function searchProductsForPos(query: string): Promise<PosProductResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      isArchived: false,
      OR: [{ name: { contains: trimmed } }, { sku: { contains: trimmed } }],
    },
    include: {
      colors: { orderBy: { sortOrder: "asc" } },
      variants: { include: { size: true } },
    },
    take: 10,
  });

  return (
    products as unknown as {
      id: string;
      name: string;
      sku: string | null;
      price: number;
      colors: { id: string; name: string; hexValue: string | null }[];
      variants: {
        id: string;
        sizeId: string | null;
        colorId: string | null;
        stock: number;
        size: { name: string } | null;
      }[];
    }[]
  ).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    colors: p.colors,
    variants: p.variants.map((v) => ({
      id: v.id,
      sizeId: v.sizeId,
      sizeName: v.size?.name ?? null,
      colorId: v.colorId,
      stock: v.stock,
    })),
  }));
}

export type PosCustomerResult = {
  id: string;
  name: string;
  phoneNumber: string | null;
};

/** Search existing accounts by name — for optionally linking a walk-in
 * sale to a customer who's already registered on the site. */
export async function searchCustomersForPos(query: string): Promise<PosCustomerResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const users = (await prisma.user.findMany({
    where: { name: { contains: trimmed } },
    select: { id: true, name: true, phoneNumber: true },
    take: 8,
  })) as unknown as PosCustomerResult[];

  return users;
}
