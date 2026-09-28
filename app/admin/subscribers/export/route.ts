import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { phoneToLocal } from "@/lib/format";

export const dynamic = "force-dynamic";

/** CSV of every newsletter subscriber — for importing into an email/SMS tool. Admin only. */
export async function GET() {
  await requireAdmin();
  const rows = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "asc" } });

  const lines = ["contact,type,created_at"];
  for (const r of rows) {
    const isPhone = r.contact.startsWith("+98");
    const value = isPhone ? phoneToLocal(r.contact) : r.contact;
    // Neutralise spreadsheet formula injection in user-supplied values.
    const safe = /^[=+\-@]/.test(value) && !isPhone ? `'${value}` : value;
    lines.push(`"${safe.replace(/"/g, '""')}",${isPhone ? "phone" : "email"},${r.createdAt.toISOString()}`);
  }

  return new NextResponse("\uFEFF" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nikia-subscribers.csv"',
    },
  });
}
