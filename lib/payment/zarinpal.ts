/**
 * ZarinPal payment gateway (API v4).
 * Docs: https://docs.zarinpal.com/paymentGateway/
 *
 * ⚠️ Written from the public documentation and not yet exercised against a
 * live merchant account — test with PAYMENT_GATEWAY_SANDBOX="true" first.
 * Amounts: this app stores prices in Toman; the gateway wants Rial (×10).
 */

const HOSTS = {
  live: { api: "https://api.zarinpal.com", pay: "https://www.zarinpal.com/pg/StartPay" },
  sandbox: { api: "https://sandbox.zarinpal.com", pay: "https://sandbox.zarinpal.com/pg/StartPay" },
};

const host = () =>
  process.env.PAYMENT_GATEWAY_SANDBOX === "true" ? HOSTS.sandbox : HOSTS.live;

type ZarinpalEnvelope<T> = {
  data: T | [];
  errors: [] | { code: number; message: string };
};

async function call<T>(path: string, body: Record<string, unknown>): Promise<ZarinpalEnvelope<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(`${host().api}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    return (await res.json()) as ZarinpalEnvelope<T>;
  } finally {
    clearTimeout(timer);
  }
}

export async function zarinpalRequest(input: {
  merchantId: string;
  amountToman: number;
  callbackUrl: string;
  description: string;
  mobile?: string | null;
}): Promise<{ authority: string; redirectUrl: string }> {
  const res = await call<{ code: number; authority: string }>("/pg/v4/payment/request.json", {
    merchant_id: input.merchantId,
    amount: input.amountToman * 10,
    callback_url: input.callbackUrl,
    description: input.description,
    ...(input.mobile ? { metadata: { mobile: input.mobile } } : {}),
  });

  const data = res.data;
  if (Array.isArray(data) || data.code !== 100 || !data.authority) {
    const err = Array.isArray(res.errors) ? null : res.errors;
    throw new Error(`ZarinPal request failed${err ? ` (${err.code}: ${err.message})` : ""}`);
  }
  return { authority: data.authority, redirectUrl: `${host().pay}/${data.authority}` };
}

export async function zarinpalVerify(input: {
  merchantId: string;
  amountToman: number;
  authority: string;
}): Promise<{ success: boolean; refId?: string; message?: string }> {
  const res = await call<{ code: number; ref_id: number }>("/pg/v4/payment/verify.json", {
    merchant_id: input.merchantId,
    amount: input.amountToman * 10,
    authority: input.authority,
  });

  const data = res.data;
  // 100 = verified now, 101 = this payment was already verified earlier.
  if (!Array.isArray(data) && (data.code === 100 || data.code === 101)) {
    return { success: true, refId: String(data.ref_id) };
  }
  const err = Array.isArray(res.errors) ? null : res.errors;
  return { success: false, message: err ? `${err.code}: ${err.message}` : "verification failed" };
}
