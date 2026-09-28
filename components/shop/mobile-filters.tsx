"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

/** Below `lg` the filter panel lives in a slide-over; the panel itself is server-rendered and passed in. */
export function MobileFilters({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 rounded-sm border border-line px-4 text-[13px] lg:hidden"
      >
        <SlidersHorizontal className="size-4" strokeWidth={1.5} />
        فیلترها{activeCount > 0 && ` (${activeCount.toLocaleString("fa-IR")})`}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="overflow-y-auto p-5">
          <SheetTitle>فیلترها</SheetTitle>
          <SheetDescription className="sr-only">سایز، رنگ و قیمت را انتخاب کنید.</SheetDescription>
          <div onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
