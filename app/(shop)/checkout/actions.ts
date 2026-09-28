"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createOrder } from "@/lib/orders/create-order";
import { failPendingOrder, markOrderPaid } from "@/lib/orders/lifecycle";
import { initiatePayment, isSimulatorEnabled } from "@/lib/payment";

export type CheckoutItem = { productId: string; variantId: string; quantity: number };

export type AddressFields = {
  fullName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
};

export type PlaceOrderResult =
  | { error: string }
  | { redirectUrl: string; orderId: string };

export async function placeOrder(
  items: CheckoutItem[],
  address: AddressFields,
  discountCode?: string | null,
): Promise<PlaceOrderResult> {
  const session = await getSession();
  if (!session) return { error: "برای ثبت سفارش ابتدا وارد حساب کاربری شوید." };

  const created = await createOrder({
    userId: session.user.id,
    items,
    address,
    discountCode,
  });
  if (!created.ok) return { error: created.error };
  const { order } = created;

  const payment = await initiatePayment({
    id: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    mobile: address.phone,
  });

  if (!payment.ok) {
    // The gateway couldn't be reached: undo the reservation right away so
    // the customer can simply try again, instead of leaving stock locked.
    await failPendingOrder(order.id);
    return { error: payment.error };
  }

  if (payment.gatewayRef) {
    await prisma.order.update({
      where: { id: order.id },
      data: { gatewayRef: payment.gatewayRef },
    });
  }
  return { redirectUrl: payment.redirectUrl, orderId: order.id };
}

/**
 * Stands in for a real gateway while none is connected, so the full
 * order → pay → result flow can be tested. Refuses to run unless the
 * simulator is enabled, the caller is signed in, and the order is theirs
 * and still unpaid.
 */
export async function completeSimulatedPayment(
  orderId: string,
  outcome: "success" | "fail",
): Promise<{ redirectUrl: string } | { error: string }> {
  if (!isSimulatorEnabled()) return { error: "درگاه آزمایشی غیرفعال است." };

  const session = await getSession();
  if (!session) return { error: "ابتدا وارد حساب کاربری شوید." };

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    select: { id: true, status: true },
  });
  if (!order || order.status !== "PENDING_PAYMENT") {
    return { error: "این سفارش در انتظار پرداخت نیست." };
  }

  if (outcome === "success") {
    await markOrderPaid(order.id, `SIM-${Date.now()}`);
  } else {
    await failPendingOrder(order.id);
  }
  return { redirectUrl: `/checkout/result?order=${order.id}` };
}
