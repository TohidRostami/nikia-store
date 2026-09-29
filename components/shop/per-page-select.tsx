"use client";

import { useRouteTransition } from "@/components/shared/route-transition-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PER_PAGE_OPTIONS } from "@/lib/queries/products-per-page";
import { toPersianDigits } from "@/lib/format";

/** `hrefs` are prebuilt by the caller (buildShopHref, same as SortSelect/CategorySelect) — kept as one URL-building path instead of a second, parallel one. */
export function PerPageSelect({
  value,
  hrefs,
}: {
  value: number;
  hrefs: Record<number, string>;
}) {
  const { push } = useRouteTransition();

  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0 text-xs text-muted-foreground">
        تعداد در صفحه:
      </span>
      <Select
        value={String(value)}
        onValueChange={(next) => push(hrefs[Number(next)])}
      >
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
              {toPersianDigits(n)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
