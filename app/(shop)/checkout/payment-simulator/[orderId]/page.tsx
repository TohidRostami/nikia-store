import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaymentSimulator } from "@/components/shop/payment-simulator";
import { prisma } from "@/lib/db";
import { formatToman, toPersianDigits } from "@/lib/format";
import { isSimulatorEnabled } from "@/lib/payment";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "درگاه آزمایشی", robots: { index: false } };

/** A stand-in for the bank page while no real gateway is connected (development / staging only). */
export default async function PaymentSimulatorPage({ params }: { params: Promise<{ orderId: string }> }) {
  if (!isSimulatorEnabled()) notFound();

  const { orderId } = await params;
  const session = await requireUser(`/checkout/payment-simulator/${orderId}`);
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id, status: "PENDING_PAYMENT" },
    select: { orderNumber: true, total: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-[clamp(40px,6vw,72px)]">
      <div className="rounded-md border border-dashed border-sale bg-white p-4 text-[13px] leading-8 text-sale">
        این یک درگاه آزمایشی است و پولی جابه‌جا نمی‌شود. برای پرداخت واقعی، شناسه پذیرنده‌ی درگاه را در تنظیمات محیطی (PAYMENT_GATEWAY_MERCHANT_ID) وارد کنید.
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-medium">پرداخت سفارش</h1>
        <p className="text-sm text-body">
          سفارش <span className="font-nums">{toPersianDigits(order.orderNumber)}</span> · مبلغ {formatToman(order.total)}
        </p>
      </div>
      <PaymentSimulator orderId={orderId} />
    </div>
  );
}
