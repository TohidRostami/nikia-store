import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopView } from "@/components/shop/shop-view";
import { getCategoryBySlug } from "@/lib/queries/products";
import {
  hasActiveFilters,
  hasNonDefaultPaging,
  parseShopParams,
} from "@/lib/shop-url";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const filters = parseShopParams(sp);
  return {
    title: category.title,
    description:
      category.description ?? `${category.title} زنانه — خرید آنلاین از نیکیا`,
    alternates: { canonical: `/products/category/${slug}` },
    robots:
      filters.q || hasActiveFilters(filters) || hasNonDefaultPaging(filters)
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  return <ShopView category={category} params={parseShopParams(sp)} />;
}
{/* <div
            className="no-scrollbar flex max-w-full gap-2 overflow-x-auto"
            role="list"
            aria-label="دسته‌بندی‌ها"
          >
            <TransitionLink
              role="listitem"
              href={buildShopHref(params, null, { page: null })}
              className={cn(
                chip,
                !category
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-white hover:border-ink",
              )}
            >
              همه
            </TransitionLink>
            {categories.map((c) => (
              <TransitionLink
                role="listitem"
                key={c.id}
                href={buildShopHref(params, c.slug, { page: null })}
                className={cn(
                  chip,
                  category?.id === c.id
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-white hover:border-ink",
                )}
              >
                {c.title}
              </TransitionLink>
            ))}
          </div>


 const chip =
    "shrink-0 rounded-full border px-[18px] py-[9px] text-[13px] transition-colors"; */}