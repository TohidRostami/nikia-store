import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyGatewayPayment } from "@/lib/payment";
import { failPendingOrder, markOrderPaid } from "@/lib/orders/lifecycle";

/**
 * Where the gateway sends the customer back. Set this exact URL as the
 * callback in the gateway panel:  {NEXT_PUBLIC_SITE_URL}/api/payment/callback
 *
 * The query string is never trusted for the outcome: ZarinPal's
 * "Status=OK" only means the customer *finished* on the bank page. The
 * money is confirmed by the server-to-server verify call, which also
 * re-checks the amount from our own database.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const authority = q.get("Authority") ?? q.get("authority");
  const gatewayStatus = q.get("Status") ?? q.get("status");

  const to = (orderId?: string) =>
    NextResponse.redirect(
      new URL(orderId ? `/checkout/result?order=${orderId}` : "/checkout/result", request.url),
    );

  if (!authority) return to();

  const order = await prisma.order.findFirst({
    where: { gatewayRef: authority },
    select: { id: true, total: true, status: true },
  });
  if (!order) return to();

  // Already handled (refresh, double callback) — just show the outcome.
  if (order.status !== "PENDING_PAYMENT") return to(order.id);

  if (gatewayStatus !== "OK") {
    await failPendingOrder(order.id);
    return to(order.id);
  }

  const result = await verifyGatewayPayment({ authority, amountToman: order.total });
  if (result.status === "success") {
    await markOrderPaid(order.id, result.refId);
  } else if (result.status === "failed") {
    await failPendingOrder(order.id);
  }
  // "unknown": leave the order pending — the result page offers a re-check,
  // and the gateway refunds unverified payments on its own.
  return to(order.id);
}
