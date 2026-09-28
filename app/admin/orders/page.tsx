import Link from "next/link";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { OrdersFilters } from "@/components/admin/orders-filters";
import { OrdersPagination } from "@/components/admin/orders-pagination";
import { OrdersPerPageSelect } from "@/components/admin/orders-per-page-select";
import { requireAdmin } from "@/lib/require-admin";
import { getAllOrdersForAdmin } from "@/lib/queries/admin-orders";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/lib/order-status";
import { formatJalali } from "@/lib/date";
import { TransitionRegion } from "@/components/shared/transition-region";

export const metadata: Metadata = { title: "سفارش‌ها | پنل مدیریت" };

type Props = {
  searchParams: Promise<{
    search?: string;
    date?: string;
    page?: string;
    perPage?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  // Orders is ADMIN-only — the layout alone now also lets subAdmin into
  // /admin/* in general, so this page must re-check the stricter rule
  // itself, or a direct link would let subAdmin straight in regardless
  // of the hidden nav item.
  await requireAdmin();

  const { search, date, page, perPage } = await searchParams;
  const {
    orders,
    totalCount,
    totalPages,
    page: currentPage,
    perPage: currentPerPage,
  } = await getAllOrdersForAdmin({
    search,
    date,
    page: page ? Number(page) : undefined,
    perPage: perPage ? Number(perPage) : undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">سفارش‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-nums">{totalCount}</span> سفارش
        </p>
      </div>

      <OrdersFilters />

      <div className="rounded-lg border border-border">
        {orders.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            {search || date
              ? "هیچ سفارشی با این فیلتر پیدا نشد."
              : "هنوز سفارشی ثبت نشده است."}
          </p>
        ) : (
          <>
            <TransitionRegion className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-center">سفارش</TableHead>
                    <TableHead className="text-center">مشتری</TableHead>
                    <TableHead className="text-center">نوع سفارش</TableHead>
                    <TableHead className="text-center">وضعیت</TableHead>
                    <TableHead className="text-center">تاریخ سفارش</TableHead>
                    <TableHead className="text-center">مبلغ</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-center">
                        <span className="">{order.orderNumber}</span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {order.customer?.name ??
                          order.walkInCustomerName ??
                          "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {order.source === "IN_PERSON" ? "حضوری" : "آنلاین"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={ORDER_STATUS_TONE[order.status]}>
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center ">
                        {formatJalali(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-center ">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell className="pe-6 text-center">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-sm text-accent-2 hover:underline"
                        >
                          مشاهده
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TransitionRegion>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-border p-4 sm:flex-row">
              <OrdersPerPageSelect perPage={currentPerPage} />
              <OrdersPagination page={currentPage} totalPages={totalPages} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
