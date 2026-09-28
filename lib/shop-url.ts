import {
  DEFAULT_SORT,
  PRICE_RANGES,
  type PriceRangeKey,
  type SortOption,
} from "@/lib/product-constants";
import {
  PER_PAGE_OPTIONS,
  DEFAULT_PER_PAGE,
} from "@/lib/queries/products-per-page";
import type { GetProductsOptions } from "@/lib/queries/products";

type RawParams = Record<string, string | string[] | undefined>;

export type ShopParams = {
  q: string;
  sort: SortOption;
  sale: boolean;
  sizes: string[];
  colors: string[];
  price: PriceRangeKey;
  page: number;
  perPage: number;
};

const SORTS: SortOption[] = ["popular", "newest", "price-asc", "price-desc"];
const PRICE_KEYS = PRICE_RANGES.map((r) => r.key) as string[];
const PER_PAGE_VALUES: number[] = [...PER_PAGE_OPTIONS];

const list = (v: string | string[] | undefined, max: number): string[] =>
  (Array.isArray(v) ? v : v ? [v] : [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 30)
    .slice(0, max);

/** Turns an untrusted query string into validated shop filters. */
export function parseShopParams(raw: RawParams): ShopParams {
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) ?? "";
  const sort = one(raw.sort);
  const price = one(raw.price);
  const page = Number.parseInt(one(raw.page), 10);
  const perPage = Number.parseInt(one(raw.perPage), 10);
  return {
    q: one(raw.q).trim().slice(0, 60),
    sort: (SORTS as string[]).includes(sort)
      ? (sort as SortOption)
      : DEFAULT_SORT,
    sale: one(raw.sale) === "1",
    sizes: list(raw.size, 8),
    colors: list(raw.color, 8),
    price: PRICE_KEYS.includes(price) ? (price as PriceRangeKey) : "all",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 500) : 1,
    perPage: PER_PAGE_VALUES.includes(perPage) ? perPage : DEFAULT_PER_PAGE,
  };
}

export function toQueryOptions(
  p: ShopParams,
  categorySlug?: string,
): GetProductsOptions {
  return {
    categorySlug,
    query: p.q || undefined,
    sort: p.sort,
    sale: p.sale || undefined,
    sizes: p.sizes.length ? p.sizes : undefined,
    colors: p.colors.length ? p.colors : undefined,
    price: p.price,
    page: p.page,
    perPage: p.perPage,
  };
}

export function hasActiveFilters(p: ShopParams): boolean {
  return (
    p.sale || p.sizes.length > 0 || p.colors.length > 0 || p.price !== "all"
  );
}

/** Whether pagination-related params differ from what a search engine should treat as the canonical view. */
export function hasNonDefaultPaging(p: ShopParams): boolean {
  return p.page > 1 || p.perPage !== DEFAULT_PER_PAGE;
}

type Override = Partial<{
  q: string | null;
  sort: SortOption | null;
  sale: boolean | null;
  sizes: string[] | null;
  colors: string[] | null;
  price: PriceRangeKey | null;
  page: number | null;
  perPage: number | null;
}>;

/**
 * Builds a shop URL from the current filters plus changes. Any change to a
 * filter drops back to page 1 unless `page` is set explicitly.
 * `categorySlug: null` = the all-products listing.
 */
export function buildShopHref(
  current: ShopParams,
  categorySlug: string | null,
  override: Override = {},
): string {
  const next = { ...current, ...stripNulls(override) };
  if (!("page" in override)) next.page = 1;

  const qs = new URLSearchParams();
  if (next.q) qs.set("q", next.q);
  if (next.sort !== DEFAULT_SORT) qs.set("sort", next.sort);
  if (next.sale) qs.set("sale", "1");
  for (const s of next.sizes) qs.append("size", s);
  for (const c of next.colors) qs.append("color", c);
  if (next.price !== "all") qs.set("price", next.price);
  if (next.page > 1) qs.set("page", String(next.page));
  if (next.perPage !== DEFAULT_PER_PAGE)
    qs.set("perPage", String(next.perPage));

  const base = categorySlug
    ? `/products/category/${categorySlug}`
    : "/products";
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

// `null` in an override means "reset to the default", not "leave as is".
function stripNulls(o: Override): Partial<ShopParams> {
  const out: Partial<ShopParams> = {};
  if (o.q !== undefined) out.q = o.q ?? "";
  if (o.sort !== undefined) out.sort = o.sort ?? DEFAULT_SORT;
  if (o.sale !== undefined) out.sale = o.sale ?? false;
  if (o.sizes !== undefined) out.sizes = o.sizes ?? [];
  if (o.colors !== undefined) out.colors = o.colors ?? [];
  if (o.price !== undefined) out.price = o.price ?? "all";
  if (o.page !== undefined) out.page = o.page ?? 1;
  if (o.perPage !== undefined) out.perPage = o.perPage ?? DEFAULT_PER_PAGE;
  return out;
}

export function toggleIn(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}
