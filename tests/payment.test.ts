import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createOrder } from "@/lib/orders/create-order";
import { initiatePayment } from "@/lib/payment";
import { GET as paymentCallback } from "@/app/api/payment/callback/route";
import { ADDRESS, reset, type Ctx } from "./fixtures";

const MERCHANT = "11111111-2222-3333-4444-555555555555";

/** Replaces fetch with a fake ZarinPal. Every call is recorded in `calls`. */
function fakeGateway(handler: (path: string, body: Record<string, unknown>) => unknown) {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: { body: string }) => {
      const path = new URL(url).pathname;
      const body = JSON.parse(init.body);
      calls.push({ path, body });
      const out = handler(path, body);
      if (out instanceof Error) throw out;
      return { json: async () => out };
    }),
  );
  return calls;
}

const verifyOk = (refId = 987654) => ({ data: { code: 100, ref_id: refId }, errors: [] });
const verifyFail = { data: [], errors: { code: -50, message: "session is not valid" } };

let ctx: Ctx;
let orderId: string;
let total: number;

async function newPendingOrder() {
  const r = await createOrder({
    userId: ctx.userId,
    items: [{ productId: ctx.productId, variantId: ctx.variantId, quantity: 2 }],
    address: ADDRESS,
  });
  if (!r.ok) throw new Error(r.error);
  orderId = r.order.id;
  total = r.order.total;
  await prisma.order.update({ where: { id: orderId }, data: { gatewayRef: "A0000000000000000000000000000000abcd" } });
}

const callback = (query: string) =>
  paymentCallback(new NextRequest(`http://localhost:3000/api/payment/callback?${query}`));
const AUTHORITY = "A0000000000000000000000000000000abcd";
const stock = async () => (await prisma.productVariant.findUniqueOrThrow({ where: { id: ctx.variantId } })).stock;
const status = async () => (await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status;

beforeEach(async () => {
  ctx = await reset();
  vi.stubEnv("PAYMENT_GATEWAY_MERCHANT_ID", MERCHANT);
  vi.stubEnv("PAYMENT_PROVIDER", "zarinpal");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("initiatePayment (ZarinPal)", () => {
  it("sends the amount in Rial (×10) with our callback URL and returns the StartPay redirect", async () => {
    const calls = fakeGateway(() => ({ data: { code: 100, authority: "A000000000000000000000000000000000ab" }, errors: [] }));
    const result = await initiatePayment({ id: "o1", orderNumber: "14050701000001", total: 1_060_000, mobile: "09121234567" });

    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://www.zarinpal.com/pg/StartPay/A000000000000000000000000000000000ab",
      gatewayRef: "A000000000000000000000000000000000ab",
    });
    expect(calls[0].path).toBe("/pg/v4/payment/request.json");
    expect(calls[0].body).toMatchObject({ merchant_id: MERCHANT, amount: 10_600_000, metadata: { mobile: "09121234567" } });
    expect(String(calls[0].body.callback_url)).toMatch(/\/api\/payment\/callback$/);
  });

  it("uses sandbox endpoints when asked to", async () => {
    vi.stubEnv("PAYMENT_GATEWAY_SANDBOX", "true");
    fakeGateway(() => ({ data: { code: 100, authority: "A0000000000000000000000000000000sbx1" }, errors: [] }));
    const r = await initiatePayment({ id: "o1", orderNumber: "1", total: 50_000 });
    expect(r.ok && r.redirectUrl).toContain("sandbox.zarinpal.com/pg/StartPay/");
  });

  it("returns a friendly error (no throw) when the gateway rejects or is unreachable", async () => {
    fakeGateway(() => ({ data: [], errors: { code: -9, message: "validation error" } }));
    expect((await initiatePayment({ id: "o", orderNumber: "1", total: 50_000 })).ok).toBe(false);

    fakeGateway(() => new Error("ECONNREFUSED"));
    const r = await initiatePayment({ id: "o", orderNumber: "1", total: 50_000 });
    expect(r.ok).toBe(false);
  });

  it("refuses the fake gateway in production unless explicitly allowed", async () => {
    vi.stubEnv("PAYMENT_GATEWAY_MERCHANT_ID", "");
    vi.stubEnv("NODE_ENV", "production");
    expect((await initiatePayment({ id: "o", orderNumber: "1", total: 50_000 })).ok).toBe(false);

    vi.stubEnv("ALLOW_PAYMENT_SIMULATOR", "true");
    const allowed = await initiatePayment({ id: "o9", orderNumber: "1", total: 50_000 });
    expect(allowed.ok && allowed.redirectUrl).toBe("/checkout/payment-simulator/o9");
  });
});

describe("payment callback", () => {
  it("verifies server-side with the amount from OUR database, then marks the order paid", async () => {
    await newPendingOrder();
    const calls = fakeGateway(() => verifyOk());
    // A tampered query string can't change the amount: it isn't read from there.
    const res = await callback(`Authority=${AUTHORITY}&Status=OK&Amount=1`);

    expect(calls).toHaveLength(1);
    expect(calls[0].path).toBe("/pg/v4/payment/verify.json");
    expect(calls[0].body).toMatchObject({ merchant_id: MERCHANT, authority: AUTHORITY, amount: total * 10 });
    expect(await status()).toBe("PAID");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).paymentRefId).toBe("987654");
    expect(res.headers.get("location")).toBe(`http://localhost:3000/checkout/result?order=${orderId}`);
  });

  it("is idempotent: a second callback neither re-verifies nor changes anything", async () => {
    await newPendingOrder();
    const calls = fakeGateway(() => verifyOk());
    await callback(`Authority=${AUTHORITY}&Status=OK`);
    await callback(`Authority=${AUTHORITY}&Status=OK`);
    expect(calls).toHaveLength(1);
    expect(await status()).toBe("PAID");
  });

  it("customer cancelled at the bank (Status=NOK): order cancelled, stock returned, gateway never called", async () => {
    await newPendingOrder();
    const calls = fakeGateway(() => verifyOk());
    expect(await stock()).toBe(1);
    await callback(`Authority=${AUTHORITY}&Status=NOK`);
    expect(calls).toHaveLength(0);
    expect(await status()).toBe("CANCELLED");
    expect(await stock()).toBe(3);
  });

  it("gateway says the payment is invalid: order cancelled and stock returned", async () => {
    await newPendingOrder();
    fakeGateway(() => verifyFail);
    await callback(`Authority=${AUTHORITY}&Status=OK`);
    expect(await status()).toBe("CANCELLED");
    expect(await stock()).toBe(3);
  });

  it("verification unreachable: the order stays pending (money may have moved — never cancel blindly)", async () => {
    await newPendingOrder();
    fakeGateway(() => new Error("timeout"));
    await callback(`Authority=${AUTHORITY}&Status=OK`);
    expect(await status()).toBe("PENDING_PAYMENT");
    expect(await stock()).toBe(1);

    // …and the re-check link on the result page succeeds once the gateway is back.
    fakeGateway(() => verifyOk(111));
    await callback(`Authority=${AUTHORITY}&Status=OK`);
    expect(await status()).toBe("PAID");
  });

  it("unknown authority or no authority: nothing happens, safe redirect", async () => {
    await newPendingOrder();
    const calls = fakeGateway(() => verifyOk());
    const a = await callback("Authority=A000doesnotexist&Status=OK");
    const b = await callback("Status=OK");
    expect(calls).toHaveLength(0);
    expect(a.headers.get("location")).toMatch(/\/checkout\/result$/);
    expect(b.headers.get("location")).toMatch(/\/checkout\/result$/);
    expect(await status()).toBe("PENDING_PAYMENT");
  });
});
