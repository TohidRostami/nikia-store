import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { computeDiscountAmount } from "@/lib/discount-calc";

export type DiscountValidationResult =
  | {
      valid: true;
      id: string;
      code: string;
      type: "PERCENTAGE" | "FIXED";
      value: number;
      discountAmount: number;
    }
  | { valid: false; error: string };

export type DiscountRow = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxUses: number | null;
  usedCount: number;
  minOrderTotal: number | null;
  expiresAt: Date | null;
  isActive: boolean;
};

export function normalizeDiscountCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * The rules for a discount code, as a pure function of the row and the
 * subtotal. Used by the cart's live preview *and* — inside the checkout
 * transaction — for the authoritative check, so the two can never drift.
 */
export function evaluateDiscount(
  discount: DiscountRow | null,
  subtotal: number,
  now = new Date(),
): DiscountValidationResult {
  if (!discount) return { valid: false, error: "کد تخفیف معتبر نیست." };
  if (!discount.isActive) return { valid: false, error: "این کد تخفیف غیرفعال است." };
  if (discount.expiresAt && discount.expiresAt < now) {
    return { valid: false, error: "این کد تخفیف منقضی شده است." };
  }
  if (discount.maxUses != null && discount.usedCount >= discount.maxUses) {
    return { valid: false, error: "ظرفیت استفاده از این کد تخفیف تمام شده است." };
  }
  if (discount.minOrderTotal != null && subtotal < discount.minOrderTotal) {
    return {
      valid: false,
      error: `این کد تخفیف فقط برای سفارش‌های بالای ${formatPrice(discount.minOrderTotal)} تومان معتبر است.`,
    };
  }
  return {
    valid: true,
    id: discount.id,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    discountAmount: computeDiscountAmount(discount.type, discount.value, subtotal),
  };
}

/** Looks a code up and evaluates it — the cart's "اعمال" button. */
export async function validateDiscountCode(
  code: string,
  subtotal: number,
): Promise<DiscountValidationResult> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return { valid: false, error: "کد تخفیف را وارد کنید." };
  const row = await prisma.discountCode.findUnique({ where: { code: normalized } });
  return evaluateDiscount(row as DiscountRow | null, subtotal);
}
