"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRouteTransition } from "@/components/shared/route-transition-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PER_PAGE_OPTIONS = [10, 25, 50];

export function OrdersPerPageSelect({ perPage }: { perPage: number }) {
  const { push } = useRouteTransition();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("perPage", value);
    params.delete("page");
    push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={String(perPage)} onValueChange={handleChange}>
      <SelectTrigger
        size="sm"
        className="w-28 text-nowrap"
        aria-label="تعداد در صفحه"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PER_PAGE_OPTIONS.map((n) => (
          <SelectItem key={n} value={String(n)}>
            {n} در صفحه
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
