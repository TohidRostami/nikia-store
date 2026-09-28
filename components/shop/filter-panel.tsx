import { TransitionLink } from "@/components/shared/transition-link";
import { CategorySelect } from "@/components/shop/category-select";
import { SortSelect } from "@/components/shop/sort-select";
import { PRICE_RANGES } from "@/lib/product-constants";
import { buildShopHref, toggleIn, type ShopParams } from "@/lib/shop-url";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ShopFacets } from "@/lib/queries/products";
import type { CategoryDTO } from "@/lib/types";

export function FilterPanel({
  facets,
  params,
  categorySlug,
  categories,
}: {
  facets: ShopFacets;
  params: ShopParams;
  categorySlug: string | null;
  categories: CategoryDTO[];
}) {
  const href = (o: Parameters<typeof buildShopHref>[2]) =>
    buildShopHref(params, categorySlug, o);

  const anyActive =
    Boolean(categorySlug) ||
    params.sale ||
    params.sizes.length > 0 ||
    params.colors.length > 0 ||
    params.price !== "all";

  const sortHrefs = {
    popular: buildShopHref(params, categorySlug, { sort: "popular" }),
    newest: buildShopHref(params, categorySlug, { sort: "newest" }),
    "price-asc": buildShopHref(params, categorySlug, { sort: "price-asc" }),
    "price-desc": buildShopHref(params, categorySlug, { sort: "price-desc" }),
  };

  return (
    <div className="flex flex-col gap-7 text-[13px]">
      {/* Sort & Category */}
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-semibold">مرتب‌سازی</legend>
          <SortSelect value={params.sort} hrefs={sortHrefs} />
        </fieldset>

        {categories.length > 0 && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-semibold">دسته‌بندی</legend>
            <CategorySelect
              value={categorySlug}
              categories={categories}
              hrefs={{
                "": buildShopHref(params, null, {}),
                ...Object.fromEntries(
                  categories.map((c) => [
                    c.slug,
                    buildShopHref(params, c.slug, {}),
                  ]),
                ),
              }}
            />
          </fieldset>
        )}
      </div>

      {facets.sizes.length > 0 && (
        <fieldset className="flex flex-col gap-3.5">
          <legend className="mb-3.5 text-sm font-semibold">سایز</legend>

          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const on = params.sizes.includes(s.name);

              return (
                <TransitionLink
                  key={s.id}
                  href={href({
                    sizes: toggleIn(params.sizes, s.name),
                  })}
                  scroll={false}
                  aria-pressed={on}
                  className={cn(
                    "flex h-11 w-12 items-center justify-center rounded-sm border text-[13px] transition-colors",
                    on
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-white hover:border-ink",
                  )}
                >
                  {toPersianDigits(s.name)}
                </TransitionLink>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold">محدوده قیمت</legend>

        {PRICE_RANGES.map((r) => {
          const on = params.price === r.key;

          return (
            <TransitionLink
              key={r.key}
              href={href({
                price: r.key === "all" ? null : r.key,
              })}
              scroll={false}
              aria-pressed={on}
              className="flex items-center gap-2.5 py-1"
            >
              <span className="flex size-4 items-center justify-center rounded-full border border-ink">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    on ? "bg-ink" : "bg-transparent",
                  )}
                />
              </span>

              {r.label}
            </TransitionLink>
          );
        })}
      </fieldset>

      <TransitionLink
        href={href({ sale: params.sale ? null : true })}
        scroll={false}
        aria-pressed={params.sale}
        className="flex items-center justify-between rounded-md bg-sand px-4 py-3.5"
      >
        فقط کالاهای تخفیف‌دار
        <span
          className={cn(
            "relative block h-5 w-9 rounded-xl transition-colors",
            params.sale ? "bg-ink" : "bg-line",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-4 rounded-full bg-white transition-all",
              params.sale ? "right-0.5" : "right-[22px]",
            )}
          />
        </span>
      </TransitionLink>

      {anyActive && (
        <TransitionLink
          href={buildShopHref(params, null, {
            sale: null,
            sizes: null,
            colors: null,
            price: null,
          })}
          scroll={false}
          className="self-start text-[13px] text-muted-foreground underline"
        >
          حذف همه فیلترها
        </TransitionLink>
      )}
    </div>
  );
}
