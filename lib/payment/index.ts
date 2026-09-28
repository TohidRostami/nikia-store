import { siteUrl } from "@/lib/content";
import { zarinpalRequest, zarinpalVerify } from "@/lib/payment/zarinpal";

/**
 * Payment layer. The rest of the app only knows these functions:
 *
 *   initiatePayment()      — start a payment for an unpaid order
 *   verifyGatewayPayment() — server-to-server check after the gateway calls back
 *
 * Provider is chosen by env: PAYMENT_GATEWAY_MERCHANT_ID + PAYMENT_PROVIDER
 * ("zarinpal" is built in). To add another gateway (Zibal, IDPay, ...),
 * add a file next to zarinpal.ts and a branch in the two functions below.
 *
 * With no merchant id, checkout uses a local simulator so the whole flow
 * can be tested — but never in production unless ALLOW_PAYMENT_SIMULATOR
 * is "true", because the simulator lets anyone "pay" for free.
 */

export const PAYMENT_CALLBACK_PATH = "/api/payment/callback";

const merchantId = () => process.env.PAYMENT_GATEWAY_MERCHANT_ID || "";
const provider = () => (process.env.PAYMENT_PROVIDER || "zarinpal").toLowerCase();

export function isSimulatorEnabled(): boolean {
  if (merchantId()) return false;
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_PAYMENT_SIMULATOR === "true"
  );
}

export type InitiatePaymentResult =
  | { ok: true; redirectUrl: string; gatewayRef: string | null }
  | { ok: false; error: string };

export async function initiatePayment(order: {
  id: string;
  orderNumber: string;
  total: number;
  mobile?: string | null;
}): Promise<InitiatePaymentResult> {
  if (!merchantId()) {
    if (!isSimulatorEnabled()) {
      return {
        ok: false,
        error: "درگاه پرداخت هنوز راه‌اندازی نشده است. لطفاً با پشتیبانی تماس بگیرید.",
      };
    }
    return { ok: true, redirectUrl: `/checkout/payment-simulator/${order.id}`, gatewayRef: null };
  }

  if (provider() !== "zarinpal") {
    return { ok: false, error: `درگاه «${provider()}» پشتیبانی نمی‌شود.` };
  }

  try {
    const { authority, redirectUrl } = await zarinpalRequest({
      merchantId: merchantId(),
      amountToman: order.total,
      callbackUrl: `${siteUrl}${PAYMENT_CALLBACK_PATH}`,
      description: `سفارش ${order.orderNumber}`,
      mobile: order.mobile,
    });
    return { ok: true, redirectUrl, gatewayRef: authority };
  } catch (e) {
    console.error("[payment] initiate failed:", e instanceof Error ? e.message : e);
    return {
      ok: false,
      error: "اتصال به درگاه پرداخت برقرار نشد. لطفاً چند دقیقه بعد دوباره تلاش کنید.",
    };
  }
}

export type VerifyResult =
  | { status: "success"; refId?: string }
  | { status: "failed"; message?: string }
  /** Couldn't reach the gateway — the payment may or may not have succeeded. */
  | { status: "unknown" };

export async function verifyGatewayPayment(input: {
  authority: string;
  amountToman: number;
}): Promise<VerifyResult> {
  if (provider() !== "zarinpal" || !merchantId()) return { status: "failed" };
  try {
    const r = await zarinpalVerify({ merchantId: merchantId(), ...input });
    return r.success ? { status: "success", refId: r.refId } : { status: "failed", message: r.message };
  } catch (e) {
    console.error("[payment] verify failed:", e instanceof Error ? e.message : e);
    return { status: "unknown" };
  }
}
