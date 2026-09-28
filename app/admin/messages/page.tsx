import type { Metadata } from "next";
import { MessageActions } from "@/components/admin/message-actions";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { formatJalali } from "@/lib/date";
import { toPersianDigits } from "@/lib/format";
import { requireAdmin } from "@/lib/require-admin";

export const metadata: Metadata = { title: "پیام‌ها | پنل مدیریت" };

export default async function AdminMessagesPage() {
  await requireAdmin();
  const messages = await prisma.contactMessage.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">پیام‌های تماس</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {toPersianDigits(messages.length)} پیام · {toPersianDigits(unread)} نخوانده
        </p>
      </div>

      {messages.length === 0 ? (
        <p className="rounded-lg border border-border px-6 py-16 text-center text-sm text-muted-foreground">
          هنوز پیامی از فرم تماس دریافت نشده است.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <li key={m.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {!m.isRead && <Badge>جدید</Badge>}
                  <b>{m.name}</b>
                  <a href={`tel:${m.phone}`} className="font-nums text-muted-foreground hover:underline">
                    {toPersianDigits(m.phone)}
                  </a>
                  <Badge variant="secondary">{m.subject}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{formatJalali(m.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-8">{m.message}</p>
              <MessageActions id={m.id} isRead={m.isRead} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
