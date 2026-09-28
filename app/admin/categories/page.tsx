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
import { getAllCategories } from "@/lib/queries/admin-products";
import { deleteCategory } from "@/app/admin/categories/actions";
import { toPersianDigits } from "@/lib/format";

export const metadata: Metadata = { title: "دسته‌بندی‌ها | پنل مدیریت" };

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">دسته‌بندی‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span>{toPersianDigits(categories.length)}</span> دسته‌بندی
          </p>
        </div>
        <div>
        <Button size="sm" asChild>
          <Link href="/admin/categories/new">
            <Plus className="size-4"/>
            دسته‌بندی جدید
          </Link>
        </Button>
        </div>
      </div>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-center">عنوان</TableHead>
              <TableHead className="text-center">اسلاگ</TableHead>
              <TableHead className="text-center">ترتیب</TableHead>
              <TableHead className="text-center">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-center font-medium">
                  {c.title}
                </TableCell>
                <TableCell
                  className="text-center font-nums text-muted-foreground"
                  dir="ltr"
                >
                  {c.slug}
                </TableCell>
                <TableCell className="text-center  text-muted-foreground">
                  {toPersianDigits(c.sortOrder)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/categories/${c.id}/edit`}>
                        ویرایش
                      </Link>
                    </Button>
                    <DeleteEntityButton
                      name={c.title}
                      confirmText={`آیا از حذف «${c.title}» مطمئن هستید؟ محصولات این دسته حذف نمی‌شوند.`}
                      action={deleteCategory.bind(null, c.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
