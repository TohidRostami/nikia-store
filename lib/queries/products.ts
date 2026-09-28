import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";
import type {
  CategoryDTO,
  ColorDTO,
  ProductDTO,
  ProductDetailDTO,
  SizeDTO,
} from "@/lib/types";
import {
  DEFAULT_PER_PAGE,
  PRICE_RANGES,
  type PriceRangeKey,
  type SortOption,
} from "@/lib/product-constants";
import { normalizeFa } from "@/lib/search";

export type { SortOption };
export { PER_PAGE_OPTIONS, DEFAULT_PER_PAGE } from "./products-per-page";

/* ───────────────────────── shared building blocks ───────────────────────── */

const PUBLIC = { isPublished: true, isArchived: false } as const;

const LISTING_INCLUDE = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  colors: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProductInclude;

type ListingRow = Prisma.ProductGetPayload<{ include: typeof LISTING_INCLUDE }>;

type RatingInfo = { rating: number; reviewCount: number };

/** Average rating + count of *approved* reviews for a set of products, in one query. */
async function getRatings(
  productIds: string[],
): Promise<Map<string, RatingInfo>> {
  if (productIds.length === 0) return new Map();
  const groups = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(
    groups.map((g) => [
      g.productId,
      { rating: g._avg.rating ?? 0, reviewCount: g._count._all },
    ]),
  );
}

function toCategoryDTO(c: ListingRow["category"]): CategoryDTO {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    image: c.image,
    sortOrder: c.sortOrder,
  };
}

function toProductDTO(
  row: ListingRow,
  ratings: Map<string, RatingInfo>,
): ProductDTO {
  const r = ratings.get(row.id);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    materialCare: row.materialCare,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    isNew: row.isNew,
    isFeatured: row.isFeatured,
    isPublished: row.isPublished,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    inStock: row.inStock,
    category: toCategoryDTO(row.category),
    images: row.images.map((i) => ({
      id: i.id,
      url: i.url,
      alt: i.alt,
      sortOrder: i.sortOrder,
      colorId: i.colorId,
    })),
    colors: row.colors.map((c) => ({
      id: c.id,
      name: c.name,
      hexValue: c.hexValue,
      sortOrder: c.sortOrder,
    })),
    rating: r ? r.rating : null,
    reviewCount: r ? r.reviewCount : 0,
  };
}

async function hydrate(rows: ListingRow[]): Promise<ProductDTO[]> {
  const ratings = await getRatings(rows.map((r) => r.id));
  return rows.map((r) => toProductDTO(r, ratings));
}

/* ───────────────────────────── categories ───────────────────────────── */

/** Fresh from the database — used by the admin panel. */
export async function getCategories(): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    image: c.image,
    sortOrder: c.sortOrder,
  }));
}

/** Cached for 60 seconds — used by the storefront header/footer/home. */
export const getCategoriesCached = unstable_cache(
  getCategories,
  ["categories"],
  {
    revalidate: 60,
  },
);

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryDTO | null> {
  const c = await prisma.category.findUnique({ where: { slug } });
  return c
    ? {
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        image: c.image,
        sortOrder: c.sortOrder,
      }
    : null;
}

/* ─────────────────────────────── listing ─────────────────────────────── */

export type GetProductsOptions = {
  categorySlug?: string;
  sort?: SortOption;
  query?: string;
  sale?: boolean;
  /** Size names, e.g. ["38", "40"] — matches products with that size *in stock*. */
  sizes?: string[];
  /** Color names, e.g. ["مشکی"]. */
  colors?: string[];
  price?: PriceRangeKey;
  page?: number;
  perPage?: number;
};

export type GetProductsResult = {
  products: ProductDTO[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export function buildProductWhere(
  o: GetProductsOptions,
): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [PUBLIC];

  if (o.categorySlug) and.push({ category: { slug: o.categorySlug } });
  if (o.sale) and.push({ compareAtPrice: { not: null } });

  const range = PRICE_RANGES.find((r) => r.key === o.price);
  if (range && range.key !== "all") {
    and.push({
      price: {
        gte: range.min,
        ...(range.max != null ? { lt: range.max } : {}),
      },
    });
  }

  if (o.sizes?.length) {
    and.push({
      variants: { some: { stock: { gt: 0 }, size: { name: { in: o.sizes } } } },
    });
  }
  if (o.colors?.length) {
    and.push({ colors: { some: { name: { in: o.colors } } } });
  }

  const q = o.query ? normalizeFa(o.query) : "";
  if (q) {
    and.push({
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { category: { title: { contains: q } } },
      ],
    });
  }
  return { AND: and };
}

function orderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "popular":
    default:
      // Most-reviewed first; featured and newest break ties (a new shop has no reviews yet).
      return [
        { reviews: { _count: "desc" } },
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ];
  }
}

export async function getProducts(
  options: GetProductsOptions = {},
): Promise<GetProductsResult> {
  const perPage =
    options.perPage && options.perPage > 0 ? options.perPage : DEFAULT_PER_PAGE;
  const requestedPage = options.page && options.page > 0 ? options.page : 1;
  const where = buildProductWhere(options);

  const totalCount = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const page = Math.min(requestedPage, totalPages);

  const rows = await prisma.product.findMany({
    where,
    include: LISTING_INCLUDE,
    orderBy: orderBy(options.sort ?? "popular"),
    skip: (page - 1) * perPage,
    take: perPage,
  });

  return {
    products: await hydrate(rows),
    totalCount,
    page,
    perPage,
    totalPages,
  };
}

export async function searchProducts(
  query: string,
  take = 8,
): Promise<ProductDTO[]> {
  const q = normalizeFa(query);
  if (!q || q.length > 60) return [];
  const rows = await prisma.product.findMany({
    where: buildProductWhere({ query: q }),
    include: LISTING_INCLUDE,
    orderBy: orderBy("popular"),
    take,
  });
  return hydrate(rows);
}

/* ─────────────────────────── filter facets ─────────────────────────── */

export type ShopFacets = {
  sizes: SizeDTO[];
  colors: { name: string; hex: string | null }[];
};

async function loadFacets(): Promise<ShopFacets> {
  const [sizes, colors] = await Promise.all([
    prisma.size.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.color.findMany({
      where: { product: PUBLIC },
      select: { name: true, hexValue: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // The same color name appears once per product — collapse to one swatch each.
  const seen = new Map<string, string | null>();
  for (const c of colors) if (!seen.has(c.name)) seen.set(c.name, c.hexValue);

  return {
    sizes: sizes.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      sortOrder: s.sortOrder,
    })),
    colors: [...seen.entries()].map(([name, hex]) => ({ name, hex })),
  };
}
export const getShopFacets = unstable_cache(loadFacets, ["shop-facets"], {
  revalidate: 60,
});

/* ─────────────────────────── home page sets ─────────────────────────── */

export type HomeData = {
  featured: ProductDTO[];
  newArrivals: ProductDTO[];
  /** A real, currently-discounted product for the home page's sale banner — null if nothing is on sale right now. */
  saleProduct: ProductDTO | null;
};

async function loadHomeData(): Promise<HomeData> {
  const [featuredRows, newRows, saleCandidateRows] = await Promise.all([
    prisma.product.findMany({
      where: { ...PUBLIC, isFeatured: true },
      include: LISTING_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.product.findMany({
      where: PUBLIC,
      include: LISTING_INCLUDE,
      orderBy: [{ isNew: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    // Prisma can't compare compareAtPrice > price directly in a `where`
    // filter (it's a comparison between two columns of the same row, not
    // against a fixed value), so a small, recently-touched candidate set is
    // fetched and the real discount check happens below in JS. This must be
    // its own catalog-wide query — picking a "sale" item by rummaging
    // through the featured/new-arrivals lists above was the actual bug:
    // those two lists have nothing to do with discounts, so whenever
    // neither happened to contain a discounted product, the banner had no
    // real sale item to show.
    prisma.product.findMany({
      where: { ...PUBLIC, compareAtPrice: { not: null } },
      include: LISTING_INCLUDE,
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);
  const [featured, newArrivals, saleCandidates] = await Promise.all([
    hydrate(featuredRows),
    hydrate(newRows),
    hydrate(saleCandidateRows),
  ]);

  const saleProduct =
    saleCandidates.find(
      (p) =>
        p.compareAtPrice != null &&
        p.compareAtPrice > p.price &&
        p.images.length > 0,
    ) ??
    saleCandidates.find(
      (p) => p.compareAtPrice != null && p.compareAtPrice > p.price,
    ) ??
    null;

  return { featured, newArrivals, saleProduct };
}
export const getHomeData = unstable_cache(loadHomeData, ["home-data"], {
  revalidate: 60,
});

/* ───────────────────────────── detail page ───────────────────────────── */

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetailDTO | null> {
  const row = await prisma.product.findFirst({
    where: { slug, ...PUBLIC },
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
  if (!row) return null;

  const ratings = await getRatings([row.id]);
  const base = toProductDTO(row, ratings);
  const toSize = (
    s: {
      id: string;
      name: string;
      description: string | null;
      sortOrder: number;
    } | null,
  ): SizeDTO | null =>
    s
      ? {
          id: s.id,
          name: s.name,
          description: s.description,
          sortOrder: s.sortOrder,
        }
      : null;
  const toColor = (
    c: {
      id: string;
      name: string;
      hexValue: string | null;
      sortOrder: number;
    } | null,
  ): ColorDTO | null =>
    c
      ? { id: c.id, name: c.name, hexValue: c.hexValue, sortOrder: c.sortOrder }
      : null;

  return {
    ...base,
    variants: row.variants.map((v) => ({
      id: v.id,
      sizeId: v.sizeId,
      size: toSize(v.size),
      colorId: v.colorId,
      color: toColor(v.color),
      stock: v.stock,
    })),
  };
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  take = 4,
): Promise<ProductDTO[]> {
  const same = await prisma.product.findMany({
    where: { ...PUBLIC, categoryId, NOT: { id: productId } },
    include: LISTING_INCLUDE,
    orderBy: [{ reviews: { _count: "desc" } }, { createdAt: "desc" }],
    take,
  });
  let rows = same;
  if (rows.length < take) {
    const more = await prisma.product.findMany({
      where: {
        ...PUBLIC,
        NOT: { id: { in: [productId, ...same.map((r) => r.id)] } },
      },
      include: LISTING_INCLUDE,
      orderBy: [{ reviews: { _count: "desc" } }, { createdAt: "desc" }],
      take: take - rows.length,
    });
    rows = [...same, ...more];
  }
  return hydrate(rows);
}

export async function getProductsByIds(ids: string[]): Promise<ProductDTO[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, ...PUBLIC },
    include: LISTING_INCLUDE,
  });
  const order = new Map(ids.map((id, i) => [id, i]));
  rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return hydrate(rows);
}
