import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { expireStaleOrders } from "@/lib/orders/lifecycle";

/**
 * Cancels unpaid orders and gives their stock back. Called daily by Vercel
 * Cron (see vercel.json) — checkout also does this opportunistically, so
 * a missed run is harmless.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;

  const ok =
    Boolean(secret) &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const expired = await expireStaleOrders(new Date(), 200);
  return NextResponse.json({ expired });
}
