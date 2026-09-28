import { TransitionLink } from "@/components/shared/transition-link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";

function buildAdminProductsHref(
  current: URLSearchParams,
  overrides: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

/** Compact page list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20 */
function getPageList(current: number, total: number): (number | "gap")[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("gap");
    result.push(sorted[i]);
  }
  return result;
}

export function AdminProductsPagination({
  currentPage,
  totalPages,
  currentParams,
}: {
  currentPage: number;
  totalPages: number;
  currentParams: URLSearchParams;
}) {
  if (totalPages <= 1) return null;

  const pages = getPageList(currentPage, totalPages);
  const hrefFor = (page: number) =>
    buildAdminProductsHref(currentParams, {
      page: page === 1 ? undefined : String(page),
    });

  return (
    <nav
      aria-label="صفحه‌بندی محصولات"
      className="flex items-center justify-center gap-1.5 py-2"
    >
      <PageLink
        href={hrefFor(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="صفحه قبل"
      >
        <ChevronRight className="size-4" />
      </PageLink>

      {pages.map((p, i) =>
        p === "gap" ? (
          <span
            key={`gap-${i}`}
            className="px-1.5 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <PageLink key={p} href={hrefFor(p)} active={p === currentPage}>
            <span>{toPersianDigits(p)}</span>
          </PageLink>
        ),
      )}

      <PageLink
        href={hrefFor(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="صفحه بعد"
      >
        <ChevronLeft className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...props
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
} & React.ComponentProps<"a">) {
  if (disabled) {
    return (
      <span className="flex size-9 items-center justify-center rounded-md text-muted-foreground/40">
        {children}
      </span>
    );
  }
  return (
    <TransitionLink
      href={href}
      className={cn(
        "flex size-9 items-center justify-center rounded-md text-sm transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-foreground/80 hover:bg-secondary hover:text-foreground",
      )}
      {...props}
    >
      {children}
    </TransitionLink>
  );
}
