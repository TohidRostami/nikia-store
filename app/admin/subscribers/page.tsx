import type { Metadata } from "next";
import { Download } from "lucide-react";
import { SubscriberDelete } from "@/components/admin/subscriber-delete";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { formatJalali } from "@/lib/date";
import { phoneToLocal, toPersianDigits } from "@/lib/format";
import { requireAdmin } from "@/lib/require-admin";

export const metadata: Metadata = { title: "خبرنامه | پنل مدیریت" };

export default async function AdminSubscribersPage() {
  await requireAdmin();
  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.newsletterSubscriber.count(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">مشترکین خبرنامه</h1>
          <p className="mt-1 text-sm text-muted-foreground">{toPersianDigits(total)} نفر</p>
        </div>
        <Button asChild variant="secondary">
          <a href="/admin/subscribers/export" download>
            <Download className="size-4" />
            دانلود CSV
          </a>
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        {subscribers.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">هنوز کسی عضو خبرنامه نشده است.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-center">ایمیل یا موبایل</TableHead>
                <TableHead className="text-center">تاریخ عضویت</TableHead>
                <TableHead className="text-center">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-nums text-center">
                    {s.contact.startsWith("+98") ? toPersianDigits(phoneToLocal(s.contact)) : s.contact}
                  </TableCell>
                  <TableCell className="text-center">{formatJalali(s.createdAt)}</TableCell>
                  <TableCell className="text-center">
                    <SubscriberDelete id={s.id} />
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
