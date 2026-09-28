import { prisma } from "@/lib/db";
import type { ProductDetailDTO, CategoryDTO } from "@/lib/types";

export type ProductFilters = {
  search?: string;
  category?: string;
  status?: string;
  featured?: string;
  sort?: string;
  page?: number;
  perPage?: number;
};

export type AdminProductsResult = {
  products: ProductDetailDTO[];
  totalCount: number;
  totalPages: number;
  page: number;
  perPage: number;
};

export const ADMIN_PRODUCTS_PER_PAGE = 10;

export async function getAllProductsForAdmin(
  filters: ProductFilters = {},
): Promise<AdminProductsResult> {
  const { search, category, status, featured, sort = "newest" } = filters;

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const perPage =
    filters.perPage && filters.perPage > 0
      ? filters.perPage
      : ADMIN_PRODUCTS_PER_PAGE;

  // Built once and reused for both findMany and count, so the total (and
  // therefore totalPages) always matches exactly what's being paginated.
  const where = {
    // Archived products (see deleteProduct) are hidden from the default
    // list — they're kept only for order-history integrity, not for
    // ongoing management.
    isArchived: false,
    ...(search
      ? {
          // No `mode: "insensitive"` — that's a Postgres/MongoDB-only
          // option. SQLite's LIKE is already case-insensitive for ASCII,
          // and Persian script has no case distinction, so plain
          // `contains` already does the right thing here.
          name: { contains: search },
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(status === "published" ? { isPublished: true } : {}),
    ...(status === "draft" ? { isPublished: false } : {}),
    ...(featured === "true" ? { isFeatured: true } : {}),
    ...(featured === "false" ? { isFeatured: false } : {}),
  };

  const orderBy =
    sort === "name-asc"
      ? { name: "asc" as const }
      : sort === "name-desc"
        ? { name: "desc" as const }
        : sort === "price-asc"
          ? { price: "asc" as const }
          : sort === "price-desc"
            ? { price: "desc" as const }
            : sort === "oldest"
              ? { createdAt: "asc" as const }
              : { createdAt: "desc" as const };

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products as unknown as ProductDetailDTO[],
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / perPage)),
    page,
    perPage,
  };
}

export async function getProductForEdit(
  id: string,
): Promise<ProductDetailDTO | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      colors: { orderBy: { sortOrder: "asc" } },
      variants: {
        include: { size: true, color: true },
        orderBy: [
          { color: { sortOrder: "asc" } },
          { size: { sortOrder: "asc" } },
        ],
      },
    },
  });
  return product as unknown as ProductDetailDTO | null;
}

export async function getAllCategories(): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return categories as unknown as CategoryDTO[];
}
