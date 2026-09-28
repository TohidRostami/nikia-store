import type { Metadata } from "next";
import { ShopView } from "@/components/shop/shop-view";
import {
  hasActiveFilters,
  hasNonDefaultPaging,
  parseShopParams,
} from "@/lib/shop-url";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = parseShopParams(await searchParams);
  return {
    title: params.q ? `جستجو: ${params.q}` : "فروشگاه",
    description:
      "همه‌ی مانتو، شومیز، پیراهن، شلوار جین و دامن‌های نیکیا؛ فیلتر بر اساس سایز، رنگ و قیمت.",
    alternates: { canonical: "/products" },
    // Filtered, searched, or non-default-paged views are for people, not the search index.
    robots:
      params.q || hasActiveFilters(params) || hasNonDefaultPaging(params)
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <ShopView category={null} params={parseShopParams(await searchParams)} />
  );
}
