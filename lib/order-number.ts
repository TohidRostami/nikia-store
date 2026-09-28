import { randomInt } from "node:crypto";
import { toJalaali } from "jalaali-js";

/**
 * Order numbers are the Jalali date plus 6 random digits — e.g.
 * 14050702483920 — so they read naturally to customers ("۱۴۰۵۰۷۰۲…" is
 * 2 Mehr 1405) and sort by date. Uniqueness is enforced by the database;
 * lib/orders/create-order.ts retries on the (very unlikely) collision.
 */
export function generateOrderNumber(date = new Date()): string {
  const { jy, jm, jd } = toJalaali(date);
  const ymd = `${jy}${String(jm).padStart(2, "0")}${String(jd).padStart(2, "0")}`;
  return `${ymd}${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
}
