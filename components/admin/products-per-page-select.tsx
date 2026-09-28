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
import { toPersianDigits } from "@/lib/format";

const PER_PAGE_OPTIONS = [4, 8, 10, 25, 50, 100];
const DEFAULT_PER_PAGE = 10;

export function AdminProductsPerPageSelect({ value }: { value: number }) {
  const { push } = useRouteTransition();
  const searchParams = useSearchParams();

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (Number(next) === DEFAULT_PER_PAGE) {
      params.delete("perPage");
    } else {
      params.set("perPage", next);
    }

    // Same reasoning as changing a filter: the current page number may
    // no longer make sense once the page size changes.
    params.delete("page");

    push(`/admin/products?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0 text-sm text-muted-foreground">
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
