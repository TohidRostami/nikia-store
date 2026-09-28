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
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { requireAdmin } from "@/lib/require-admin";
import { getAllDiscountCodes } from "@/lib/queries/admin-discounts";
import { deleteDiscountCode } from "@/app/admin/discounts/actions";
import { formatPrice, toPersianDigits } from "@/lib/format";

export const metadata: Metadata = { title: "کدهای تخفیف | پنل مدیریت" };

export default async function AdminDiscountsPage() {
  // Discounts is ADMIN-only — see the same note in orders/page.tsx.
  await requireAdmin();
  const codes = await getAllDiscountCodes();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">کدهای تخفیف</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="">{codes.length}</span> کد
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/discounts/new">
            <Plus className="size-4" />
            کد جدید
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        {codes.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            هنوز کد تخفیفی ساخته نشده است.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-center">کد</TableHead>
                <TableHead className="text-center">مقدار</TableHead>
                <TableHead className="text-center">استفاده‌شده</TableHead>
                <TableHead className="text-center">وضعیت</TableHead>
                <TableHead className="text-center">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-center  font-medium">
                    {c.code}
                  </TableCell>
                  <TableCell className="text-center  text-muted-foreground">
                    {c.type === "PERCENTAGE"
                      ? `${toPersianDigits(c.value)}٪`
                      : `${formatPrice(c.value)} تومان`}
                  </TableCell>
                  <TableCell className="text-center  text-muted-foreground">
                    {toPersianDigits(c.usedCount)}
                    {c.maxUses ? ` / ${toPersianDigits(c.maxUses)}` : ""}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={c.isActive ? "default" : "outline"}>
                      {c.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </TableCell>
                  <TableCell className="pe-6">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/discounts/${c.id}/edit`}>
                          ویرایش
                        </Link>
                      </Button>
                      <DeleteEntityButton
                        name={c.code}
                        confirmText={`آیا از حذف کد «${c.code}» مطمئن هستید؟`}
                        action={deleteDiscountCode.bind(null, c.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
