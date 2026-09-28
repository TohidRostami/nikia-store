/**
 * Pure discount-amount calculation, safe to import from client
 * components (no database access — that's lib/discount.ts, which is
 * what actually validates and is the only thing ever trusted for the
 * real charge). This is purely for showing a live preview as the cart
 * changes.
 */
export function computeDiscountAmount(
  type: "PERCENTAGE" | "FIXED",
  value: number,
  subtotal: number
): number {
  return type === "PERCENTAGE" ? Math.round((subtotal * value) / 100) : Math.min(value, subtotal);
}
