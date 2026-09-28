"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toPersianDigits } from "@/lib/format";

type Size = {
  id: string;
  name: string;
};

export function SizeSelect({
  value,
  sizes,
  hrefs,
}: {
  value: string;
  sizes: Size[];
  hrefs: Record<string, string>;
}) {
  const handleChange = (selectedSize: string) => {
    window.location.href = hrefs[selectedSize];
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        size="sm"
        aria-label="سایز"
        className="rounded-sm border border-line bg-white px-3.5 text-[13px] text-right outline-none hover:border-ink focus-visible:border-ink"
        dir="rtl"
      >
        <SelectValue placeholder="همه سایزها" />
      </SelectTrigger>

      <SelectContent>
        {sizes.map((s) => (
          <SelectItem
            key={s.id}
            value={s.name}
            className="justify-end text-right text-[13px]"
          >
            {toPersianDigits(s.name)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
