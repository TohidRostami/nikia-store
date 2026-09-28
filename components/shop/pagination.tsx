import { ArrowLeft, ArrowRight } from "lucide-react";
import { TransitionLink } from "@/components/shared/transition-link";
import { buildShopHref, type ShopParams } from "@/lib/shop-url";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/** 1 … 4 5 [6] 7 8 … 20 */
function pageList(current: number, total: number): (number | "gap")[] {
  const set = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({
  page,
  totalPages,
  params,
  categorySlug,
}: {
  page: number;
  totalPages: number;
  params: ShopParams;
  categorySlug: string | null;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => buildShopHref(params, categorySlug, { page: p });
  const box = "flex size-11 items-center justify-center rounded-sm border text-sm transition-colors";

  return (
    <nav aria-label="صفحه‌بندی" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <TransitionLink href={href(page - 1)} rel="prev" aria-label="صفحه قبل" className={cn(box, "border-line hover:border-ink")}>
          <ArrowRight className="size-4" strokeWidth={1.5} />
        </TransitionLink>
      )}
      {pageList(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <TransitionLink
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(box, p === page ? "border-ink bg-ink text-paper" : "border-line hover:border-ink")}
          >
            {toPersianDigits(p)}
          </TransitionLink>
        ),
      )}
      {page < totalPages && (
        <TransitionLink href={href(page + 1)} rel="next" aria-label="صفحه بعد" className={cn(box, "border-line hover:border-ink")}>
          <ArrowLeft className="size-4" strokeWidth={1.5} />
        </TransitionLink>
      )}
    </nav>
  );
}
