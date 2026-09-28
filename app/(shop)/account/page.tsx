import type { Metadata } from "next";
import Link from "next/link";
import { OrderRow } from "@/components/account/order-row";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/content";
import { getOrderCounts, getOrdersForCustomer } from "@/lib/queries/orders";
import { requireUser } from "@/lib/session";
import { toPersianDigits } from "@/lib/format";

export const metadata: Metadata = { title: "حساب کاربری", robots: { index: false } };

export default async function AccountDashboardPage() {
  const session = await requireUser("/account");
  const userId = session.user.id;
  const welcomeCode = siteConfig.home.newsletter.welcomeCode;

  const [counts, recent, code] = await Promise.all([
    getOrderCounts(userId),
    getOrdersForCustomer(userId, 3),
    // Only advertise the code if it really exists and is switched on.
    welcomeCode ? prisma.discountCode.findFirst({ where: { code: welcomeCode, isActive: true }, select: { code: true } }) : null,
  ]);

  const first = /^[\d۰-۹+\s]+$/.test(session.user.name) ? "" : session.user.name.split(" ")[0];

  return (
    <>
      <h1 className="text-[clamp(24px,3vw,32px)] font-normal">{first ? `سلام ${first}، خوش آمدید` : "خوش آمدید"}</h1>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <div className="flex flex-col gap-2 rounded-lg bg-sand p-5">
          <span className="text-xs text-body">سفارش‌های جاری</span>
          <b className="text-[26px] font-medium">{toPersianDigits(counts.active)}</b>
        </div>
        <div className="flex flex-col gap-2 rounded-lg bg-sand p-5">
          <span className="text-xs text-body">سفارش‌های تحویل‌شده</span>
          <b className="text-[26px] font-medium">{toPersianDigits(counts.delivered)}</b>
        </div>
        {code && (
          <div className="flex flex-col gap-2 rounded-lg bg-ink p-5 text-paper">
            <span className="text-xs text-[#c9c0b4]">کد تخفیف اعضا</span>
            <b dir="ltr" className="text-right text-xl font-medium tracking-[1px]">
              {code.code}
            </b>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">آخرین سفارش‌ها</h2>
        <Link href="/account/orders" className="text-[13px] hover:text-muted-foreground">
          همه سفارش‌ها ←
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-white px-6 py-10 text-center text-sm text-muted-foreground">
          هنوز سفارشی ثبت نکرده‌اید.{" "}
          <Link href="/products" className="text-ink underline">
            شروع خرید
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      )}
    </>
  );
}
