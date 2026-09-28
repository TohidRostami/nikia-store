"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, type SortOption } from "@/lib/product-constants";

export function SortSelect({
  value,
  hrefs,
}: {
  value: SortOption;
  hrefs: Record<SortOption, string>;
}) {
  const router = useRouter();

  const handleChange = (selectedValue: string) => {
    router.push(hrefs[selectedValue as SortOption]);
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        size="sm"
        aria-label="مرتب‌سازی"
        className="rounded-sm border border-line bg-white px-3.5 text-[13px] text-right outline-none hover:border-ink focus-visible:border-ink"
        dir="rtl"
      >
        <SelectValue placeholder="جدیدترین محصولات" />
      </SelectTrigger>

      <SelectContent>
        {SORT_OPTIONS.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
            className="justify-end text-right text-[13px]"
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
