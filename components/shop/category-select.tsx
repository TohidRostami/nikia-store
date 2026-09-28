"use client";

import { useRouteTransition } from "@/components/shared/route-transition-provider";
import type { CategoryDTO } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const ALL_VALUE = "";

/** `hrefs` are prebuilt by the caller for every option (all-products + one per category), so this stays a dumb select — same pattern as SortSelect/PerPageSelect. */
export function CategorySelect({
  value,
  categories,
  hrefs,
}: {
  /** The active category's slug, or null for "all products". */
  value: string | null;
  categories: CategoryDTO[];
  hrefs: Record<string, string>;
}) {
  const { push } = useRouteTransition();
  return (
    <Select
      value={value ?? ALL_VALUE}
      onValueChange={(selectedValue) => push(hrefs[selectedValue])}
    >
      <SelectTrigger
        size="sm"
        aria-label="دسته‌بندی"
        className="rounded-sm border border-line bg-white px-3.5 text-[13px] text-right outline-none hover:border-ink focus-visible:border-ink"
        dir="rtl"
      >
        <SelectValue placeholder="همه محصولات" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem
          value={ALL_VALUE}
          className="justify-end text-right text-[13px]"
        >
          همه محصولات
        </SelectItem>

        {categories.map((c) => (
          <SelectItem
            key={c.id}
            value={c.slug}
            className="justify-end text-right text-[13px]"
          >
            {c.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
