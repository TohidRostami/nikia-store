import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Check, Clock } from "lucide-react";
import { ClearCart } from "@/components/shop/clear-cart";
import { prisma } from "@/lib/db";
import { formatToman, toPersianDigits } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "نتیجه پرداخت", robots: { index: false } };

const PAID = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  const session = await requireUser(orderId ? `/checkout/result?order=${orderId}` : "/account/orders");

  // Looked up by id *and* owner — nobody can read another customer's order by guessing an id.
  const order = orderId
    ? await prisma.order.findFirst({
        where: { id: orderId, userId: session.user.id },
        select: { id: true, orderNumber: true, total: true, status: true, paymentRefId: true, gatewayRef: true },
      })
    : null;

  const state = !order ? "missing" : PAID.includes(order.status) ? "paid" : order.status === "PENDING_PAYMENT" ? "pending" : "failed";

  const view = {
    paid: {
      icon: <Check className="size-8" />,
      tone: "bg-ink text-paper",
      title: "پرداخت با موفقیت انجام شد",
      text: (
        <>
          سپاس از خرید شما. شماره سفارش <b className="font-nums text-ink">{toPersianDigits(order?.orderNumber ?? "")}</b> ثبت شد و پس از ارسال، کد رهگیری برایتان پیامک می‌شود.
        </>
      ),
    },
    pending: {
      icon: <Clock className="size-8" />,
      tone: "bg-sand-3 text-ink",
      title: "پرداخت شما در حال بررسی است",
      text: "هنوز نتیجه‌ی پرداخت از بانک تأیید نشده است. اگر مبلغ از حساب شما کسر شده، لحظاتی بعد دوباره وضعیت را بررسی کنید؛ در غیر این صورت مبلغ به‌صورت خودکار به حساب شما بازمی‌گردد.",
    },
    failed: {
      icon: <AlertCircle className="size-8" />,
      tone: "bg-sale text-white",
      title: "پرداخت انجام نشد",
      text: "پرداخت لغو شد یا ناموفق بود و مبلغی از حساب شما کسر نشده است (اگر کسر شده باشد، بانک آن را خودکار برمی‌گرداند). سبد خرید شما حفظ شده است؛ می‌توانید دوباره تلاش کنید.",
    },
    missing: {
      icon: <AlertCircle className="size-8" />,
      tone: "bg-sand-3 text-ink",
      title: "سفارشی پیدا نشد",
      text: "برای دیدن وضعیت سفارش‌هایتان به بخش «سفارش‌های من» بروید.",
    },
  }[state];

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-4 px-5 py-[clamp(40px,6vw,72px)] text-center">
      {state === "paid" && <ClearCart />}
      <span className={`flex size-[72px] items-center justify-center rounded-full ${view.tone}`}>{view.icon}</span>
      <h1 className="text-[clamp(24px,3.4vw,34px)] font-medium">{view.title}</h1>
      <p className="text-sm leading-[2.1] text-body">{view.text}</p>

      {order && state === "paid" && (
        <dl className="mt-2 grid w-full grid-cols-2 gap-3 rounded-lg bg-sand p-5 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">مبلغ پرداختی</dt>
            <dd className="mt-1 font-medium">{formatToman(order.total)}</dd>
          </div>
          {order.paymentRefId && (
            <div>
              <dt className="text-xs text-muted-foreground">کد پیگیری بانک</dt>
              <dd className="font-nums mt-1 font-medium">{order.paymentRefId}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {state === "pending" && order?.gatewayRef && (
          // Re-runs the (idempotent) server-side verification.
          <a
            href={`/api/payment/callback?Authority=${encodeURIComponent(order.gatewayRef)}&Status=OK`}
            className="rounded-sm bg-ink px-7 py-3.5 text-sm text-paper transition-colors hover:bg-ink/90"
          >
            بررسی مجدد پرداخت
          </a>
        )}
        {state === "failed" && (
          <Link href="/cart" className="rounded-sm bg-ink px-7 py-3.5 text-sm text-paper transition-colors hover:bg-ink/90">
            بازگشت به سبد خرید
          </Link>
        )}
        <Link
          href={state === "paid" && order ? `/account/orders/${order.id}` : "/account/orders"}
          className={
            state === "paid"
              ? "rounded-sm bg-ink px-7 py-3.5 text-sm text-paper transition-colors hover:bg-ink/90"
              : "rounded-sm border border-ink px-7 py-3.5 text-sm transition-colors hover:bg-ink hover:text-paper"
          }
        >
          {state === "paid" ? "مشاهده سفارش" : "سفارش‌های من"}
        </Link>
        {state === "paid" && (
          <Link href="/products" className="rounded-sm border border-ink px-7 py-3.5 text-sm transition-colors hover:bg-ink hover:text-paper">
            ادامه خرید
          </Link>
        )}
      </div>
    </div>
  );
}
