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