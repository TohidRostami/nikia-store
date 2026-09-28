import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { getAllSizes } from "@/lib/queries/admin-sizes";
import { deleteSize } from "@/app/admin/sizes/actions";
import { toPersianDigits } from "@/lib/format";

export const metadata: Metadata = { title: "سایزها | پنل مدیریت" };

export default async function AdminSizesPage() {
  const sizes = await getAllSizes();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">سایزها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span>{toPersianDigits(sizes.length)}</span> سایز — مشترک بین
            همه محصولات
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/sizes/new">
            <Plus className="size-4" />
            سایز جدید
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        {sizes.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            هنوز سایزی ساخته نشده است. اولین سایز را همین‌جا یا هنگام افزودن
            محصول بسازید.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-center">نام</TableHead>
                <TableHead className="text-center">توضیح / ابعاد</TableHead>
                <TableHead className="text-center">ترتیب</TableHead>
                <TableHead className="text-center">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sizes.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-center  font-medium">
                    {s.name}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {s.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-center  text-muted-foreground">
                    {toPersianDigits(s.sortOrder)}
                  </TableCell>
                  <TableCell className="pe-6">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/sizes/${s.id}/edit`}>ویرایش</Link>
                      </Button>
                      <DeleteEntityButton
                        name={s.name}
                        confirmText={`آیا از حذف سایز «${s.name}» مطمئن هستید؟ اگر محصولی از این سایز استفاده کند ممکن است با خطا مواجه شوید.`}
                        action={deleteSize.bind(null, s.id)}
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
