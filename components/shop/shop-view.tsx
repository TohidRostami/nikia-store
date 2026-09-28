import Link from "next/link";
import { TransitionRegion } from "@/components/shared/transition-region";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/shared/product-card";
import { FilterPanel } from "@/components/shop/filter-panel";
import { MobileFilters } from "@/components/shop/mobile-filters";
import { Pagination } from "@/components/shop/pagination";
import { PerPageSelect } from "@/components/shop/per-page-select";
import { SortSelect } from "@/components/shop/sort-select";
import { SearchX } from "lucide-react";
import {
  getCategoriesCached,
  getProducts,
  getShopFacets,
} from "@/lib/queries/products";
import { PER_PAGE_OPTIONS } from "@/lib/queries/products-per-page";
import { SORT_OPTIONS, type SortOption } from "@/lib/product-constants";
import { buildShopHref, toQueryOptions, type ShopParams } from "@/lib/shop-url";
import { toPersianDigits } from "@/lib/format";
import type { CategoryDTO } from "@/lib/types";
import { CategorySelect } from "./category-select";
import { SizeSelect } from "./select-size";
import { TransitionLink } from "../shared/transition-link";
import { cn } from "@/lib/utils";

export async function ShopView({
  category,
  params,
}: {
  category: CategoryDTO | null;
  params: ShopParams;
}) {
  const slug = category?.slug ?? null;
  const [categories, facets, result] = await Promise.all([
    getCategoriesCached(),
    getShopFacets(),
    getProducts(toQueryOptions(params, slug ?? undefined)),
  ]);

  const title = params.q
    ? `نتایج جستجو برای «${params.q}»`
    : category
      ? category.title
      : params.sale
        ? "کالاهای تخفیف‌دار"
        : "همه محصولات";

  const activeCount =
    (category ? 1 : 0) +
    (params.sale ? 1 : 0) +
    params.sizes.length +
    params.colors.length +
    (params.price !== "all" ? 1 : 0);

  const sortHrefs = Object.fromEntries(
    SORT_OPTIONS.map((o) => [
      o.value,
      buildShopHref(params, slug, { sort: o.value }),
    ]),
  ) as Record<SortOption, string>;

  const perPageHrefs = Object.fromEntries(
    PER_PAGE_OPTIONS.map((n) => [
      n,
      buildShopHref(params, slug, { perPage: n }),
    ]),
  ) as Record<number, string>;

  const sizeHrefs = Object.fromEntries(
    facets.sizes.map((s) => [
      s.name,
      buildShopHref(params, slug, {
        sizes: [s.name],
      }),
    ]),
  ) as Record<string, string>;

  const hasActiveFilters =
    Boolean(slug) ||
    params.sale ||
    params.sizes.length > 0 ||
    params.colors.length > 0 ||
    params.price !== "all";

  return (
    <>
      <section className="bg-sand mx-2 rounded-xl">
        <div className="wrap flex flex-col gap-2.5 py-[clamp(28px,4vw,48px)]">
          <nav
            aria-label="مسیر"
            className="flex gap-2 text-xs text-muted-foreground"
          >
            <Link href="/" className="hover:text-ink">
              خانه
            </Link>
            <span aria-hidden="true">/</span>
            {category ? (
              <>
                <Link href="/products" className="hover:text-ink">
                  فروشگاه
                </Link>
                <span aria-hidden="true">/</span>
              </>
            ) : null}
            <span className="text-ink">
              {category ? category.title : "فروشگاه"}
            </span>
          </nav>
          <h1 className="text-[clamp(28px,4vw,44px)] font-normal">{title}</h1>
          <p className="text-sm text-body">
            {category?.description && !params.q
              ? `${category.description} · `
              : ""}
            {toPersianDigits(result.totalCount)} محصول
          </p>
        </div>
      </section>

      <div className="wrap pt-[clamp(20px,3vw,36px)]">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-5">
          {/* Desktop filters */}
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex items-center gap-1">
              <span className="shrink-0 text-xs text-muted-foreground">
                مرتب سازی:
              </span>

              <SortSelect value={params.sort} hrefs={sortHrefs} />
            </div>

            <div className="flex items-center gap-1">
              <span className="shrink-0 text-xs text-muted-foreground">
                دسته بندی:
              </span>

              <CategorySelect
                value={slug}
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
            </div>

            {/* Size */}
            {facets.sizes.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="shrink-0 text-xs text-muted-foreground">
                  سایز:
                </span>

                <SizeSelect
                  value={params.sizes[0] ?? ""}
                  sizes={facets.sizes}
                  hrefs={sizeHrefs}
                />
              </div>
            )}

            {/* Sale */}
            <TransitionLink
              href={buildShopHref(params, slug, {
                sale: params.sale ? null : true,
              })}
              scroll={false}
              className={cn(
                "rounded-sm border px-3.5 py-2 text-[13px] transition-colors",
                params.sale
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-white hover:border-ink",
              )}
            >
              فقط تخفیف‌دار
            </TransitionLink>

            {/* Clear filters */}
            {hasActiveFilters && (
              <TransitionLink
                href={buildShopHref(params, null, {
                  sale: null,
                  sizes: null,
                  colors: null,
                  price: null,
                })}
                scroll={false}
                className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-ink"
              >
                حذف فیلترها
              </TransitionLink>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            <MobileFilters activeCount={activeCount}>
              <FilterPanel
                facets={facets}
                params={params}
                categorySlug={slug}
                categories={categories}
              />
            </MobileFilters>

            <PerPageSelect
              value={result.perPage}
              categorySlug={slug ?? undefined}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-10">
          <TransitionRegion className="min-w-0 flex-[999_1_480px]">
            {result.products.length > 0 ? (
              <>
                <div className="grid gap-[clamp(12px,2vw,24px)] [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(230px,1fr))] lg:[grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
                  {result.products.map((p, i) => (
                    <ProductCard key={p.id} product={p} priority={i < 4} />
                  ))}
                </div>
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  params={params}
                  categorySlug={slug}
                />
              </>
            ) : (
              <EmptyState
                icon={SearchX}
                title="محصولی با این فیلترها پیدا نشد"
                description="فیلترها را کم کنید یا عبارت جستجو را تغییر دهید."
                actionLabel="حذف فیلترها"
                actionHref={
                  category ? `/products/category/${category.slug}` : "/products"
                }
              />
            )}
          </TransitionRegion>
        </div>
      </div>
    </>
  );
}
