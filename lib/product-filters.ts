export function buildProductsHref(
  current: URLSearchParams,
  overrides: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams(current.toString());
  // Category now lives in the URL path (/products/category/[slug]),
  // not as a query param, so it's stripped from the query string here
  // and handled separately below.
  params.delete("category");

  const categorySlug =
    "category" in overrides
      ? overrides.category
      : (current.get("category") ?? undefined);

  for (const [key, value] of Object.entries(overrides)) {
    if (key === "category") continue;
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  const base = categorySlug
    ? `/products/category/${categorySlug}`
    : "/products";
  return qs ? `${base}?${qs}` : base;
}
