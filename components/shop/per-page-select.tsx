"use client";

import { useSearchParams } from "next/navigation";
import { useRouteTransition } from "@/components/shared/route-transition-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildProductsHref } from "@/lib/product-filters";
import { DEFAULT_PER_PAGE } from "@/lib/product-constants";
import { PER_PAGE_OPTIONS } from "@/lib/queries/products-per-page";
import { toPersianDigits } from "@/lib/format";

export function PerPageSelect({ value, categorySlug }: { value: number; categorySlug?: string }) {
  const { push } = useRouteTransition();
  const searchParams = useSearchParams();

  function handleChange(next: string) {
    const href = buildProductsHref(
      new URLSearchParams(searchParams.toString()),
      {
        // See mobile-product-filters.tsx — category lives in the path
        // now, so it has to be threaded through explicitly.
        category: categorySlug,
        perPage: Number(next) === DEFAULT_PER_PAGE ? undefined : next,
        page: undefined,
      },
    );
    push(href);
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0 text-xs text-muted-foreground">
        تعداد در صفحه:
      </span>
      <Select value={String(value)} onValueChange={handleChange}>
        <SelectTrigger
          size="sm"
          aria-label="تعداد محصول در صفحه"
          className="w-20 text-right text-xs"
          dir="rtl"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PER_PAGE_OPTIONS.map((n) => (
            <SelectItem
              key={n}
              value={String(n)}
              className="justify-end text-right text-xs"
            >
              <span className="">{toPersianDigits(n)}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
