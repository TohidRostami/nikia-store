import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductsFilters } from "@/components/admin/products-filters";
import { AdminProductsPagination } from "@/components/admin/products-pagination";

import { getAllProductsForAdmin } from "@/lib/queries/admin-products";
import { getCategories } from "@/lib/queries/products";
import { formatPrice, toPersianDigits } from "@/lib/format";
import { AdminProductsPerPageSelect } from "@/components/admin/products-per-page-select";
import { TransitionRegion } from "@/components/shared/transition-region";
import { TransitionLink } from "@/components/shared/transition-link";

export const metadata: Metadata = {
  title: "محصولات | پنل مدیریت",
};

type SearchParams = Promise<{
  search?: string;
  category?: string;
  status?: string;
  featured?: string;
  sort?: string;
  perPage: number;
  page?: string;
}>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) || 1 : 1;
  const perPage = params.perPage
    ? Number(params.perPage) || undefined
    : undefined;

  const [result, categories] = await Promise.all([
    getAllProductsForAdmin({
      search: params.search,
      category: params.category,
      status: params.status,
      featured: params.featured,
      sort: params.sort,
      page,
      perPage: perPage,
    }),

    getCategories(),
  ]);

  const {
    products,
    totalCount,
    totalPages,
    page: currentPage,
    perPage: currentPerPage,
  } = result;

  // Preserves every active filter when building pagination links, so
  // clicking page 2 doesn't drop the current search/category/etc.
  const currentParams = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">محصولات</h1>

          <p className="text-sans mt-1 text-sm text-muted-foreground">
            <span>{toPersianDigits(totalCount)}</span> محصول
          </p>
        </div>

        <Button asChild>
          <TransitionLink href="/admin/products/new">
            <Plus className="size-4" />
            محصول جدید
          </TransitionLink>
        </Button>
      </div>

      {/* Filters */}
      <ProductsFilters categories={categories} />

      <div className="flex justify-end">
        <AdminProductsPerPageSelect value={currentPerPage} />
      </div>
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <TransitionRegion className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-6 text-center">نام</TableHead>

                <TableHead className="ps-6 text-center">دسته‌بندی</TableHead>

                <TableHead className="ps-6 text-center">قیمت</TableHead>

                <TableHead className="ps-6 text-center">وضعیت</TableHead>

                <TableHead className="ps-6 text-center">عملیات</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    محصولی با این مشخصات پیدا نشد.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="ps-6 text-center font-medium">
                      {p.name}
                    </TableCell>

                    <TableCell className="text-center text-muted-foreground">
                      {p.category.title}
                    </TableCell>

                    <TableCell className=" text-center">
                      {formatPrice(p.price)}
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-center gap-1.5">
                        <Badge variant={p.isPublished ? "default" : "outline"}>
                          {p.isPublished ? "منتشرشده" : "پیش‌نویس"}
                        </Badge>

                        {p.isFeatured && <Badge variant="accent">ویژه</Badge>}
                      </div>
                    </TableCell>

                    <TableCell className="pe-6">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/products/${p.id}/edit`}>
                            ویرایش
                          </Link>
                        </Button>

                        <DeleteProductButton id={p.id} name={p.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TransitionRegion>
      </div>

      <AdminProductsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        currentParams={currentParams}
      />
    </div>
  );
}
