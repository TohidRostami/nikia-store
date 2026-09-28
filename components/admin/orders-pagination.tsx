"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRouteTransition } from "@/components/shared/route-transition-provider";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function OrdersPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const { push } = useRouteTransition();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        aria-label="صفحه‌ی قبل"
        className={cn(
          "flex size-8 items-center justify-center rounded-md border border-border text-foreground transition-colors",
          page <= 1 ? "cursor-not-allowed opacity-30" : "hover:bg-secondary",
        )}
      >
        <ChevronRight className="size-4" />
      </button>
      <span className="text-sm text-muted-foreground">
        صفحه {page} از {totalPages}
      </span>
      <button
        type="button"
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="صفحه‌ی بعد"
        className={cn(
          "flex size-8 items-center justify-center rounded-md border border-border text-foreground transition-colors",
          page >= totalPages
            ? "cursor-not-allowed opacity-30"
            : "hover:bg-secondary",
        )}
      >
        <ChevronLeft className="size-4" />
      </button>
    </div>
  );
}
