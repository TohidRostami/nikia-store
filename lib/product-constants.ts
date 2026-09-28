export type SortOption = "newest" | "price-asc" | "price-desc" | "popular";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "جدیدترین" },
  { value: "popular", label: "محبوب‌ترین" },
  { value: "price-asc", label: "ارزان‌ترین" },
  { value: "price-desc", label: "گران‌ترین" },
];

export const DEFAULT_SORT: SortOption = "newest";
export const DEFAULT_PER_PAGE = 8;

/** Price buckets shown in the shop filter (Toman). `max` is exclusive. */
export const PRICE_RANGES = [
  { key: "all", label: "همه قیمت‌ها", min: 0, max: null },
  { key: "under-1m", label: "تا ۵ میلیون تومان", min: 0, max: 5_000_000 },
  { key: "1m-2m", label: "۵ تا ۱۰ میلیون تومان", min: 5_000_000, max: 10_000_000 },
  { key: "over-2m", label: "بیش از ۱۰ میلیون تومان", min: 10_000_000, max: null },
] as const;

export type PriceRangeKey = (typeof PRICE_RANGES)[number]["key"];

/** Most units of one variant in a single order — enforced again on the server. */
export const MAX_LINE_QUANTITY = 10;
