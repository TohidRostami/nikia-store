"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { OutOfStockProductRow } from "@/lib/queries/admin-inventory";

const PER_PAGE_OPTIONS = [5, 10, 20];

export function OutOfStockCard({
  products,
  className,
}: {
  products: OutOfStockProductRow[];
  className?: string;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);

  const totalPages = Math.max(1, Math.ceil(products.length / perPage));
  // Clamped rather than trusted as-is — e.g. if perPage changes from 5
  // to 20 while sitting on page 5, there's no longer a page 5 to show.
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => products.slice((currentPage - 1) * perPage, currentPage * perPage),
    [products, currentPage, perPage],
  );

  function handlePerPageChange(value: string) {
    setPerPage(Number(value));
    setPage(1);
  }

  return (
    <div className={cn("rounded-lg border border-border", className)}>
      <div className="flex items-center justify-between gap-3 p-6 pb-4">
        <h2 className="text-sm font-medium">محصولات ناموجود</h2>
        {products.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {products.length} محصول
          </span>
        )}
      </div>

      {products.length === 0 ? (
        <p className="px-6 pb-6 text-sm text-muted-foreground">
          در حال حاضر همه‌ی محصولات موجودی دارند.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-center">محصول</TableHead>
                <TableHead className="text-center">وضعیت</TableHead>
                <TableHead className="text-center">جزئیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-center">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    {p.isFullyOutOfStock ? (
                      <Badge
                        variant="outline"
                        className="border-destructive/30 bg-destructive/10 text-destructive"
                      >
                        کاملاً ناموجود
                      </Badge>
                    ) : (
                      <Badge variant="outline">بخشی ناموجود</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.isFullyOutOfStock ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {p.outOfStockVariants.map((v, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground"
                          >
                            {v.colorName ?? "—"} / {v.sizeName ?? "—"}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between gap-3 border-t border-border p-4">
            <Select value={String(perPage)} onValueChange={handlePerPageChange}>
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

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="صفحه‌ی قبل"
                className="flex size-8 items-center justify-center rounded-md border border-border text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:bg-secondary"
              >
                <ChevronRight className="size-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                {currentPage} از {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="صفحه‌ی بعد"
                className="flex size-8 items-center justify-center rounded-md border border-border text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:bg-secondary"
              >
                <ChevronLeft className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
