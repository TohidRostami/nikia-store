const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Converts Latin digits (0-9) in the input to Persian digits — everything else is left untouched. */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** The reverse — used before parsing/validating user-typed input, since a Persian or Arabic keyboard often produces non-Latin digits. */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

const priceFormatter = new Intl.NumberFormat("fa-IR");

/** "۲٬۴۹۰٬۰۰۰" — grouped with Persian digits, no currency. */
export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

/** "۲٬۴۹۰٬۰۰۰ تومان" */
export function formatToman(value: number): string {
  return `${formatPrice(value)} تومان`;
}

/** Discount percentage between an original and a current price (0 when there is no discount). */
export function discountPercent(price: number, compareAtPrice: number | null | undefined): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round((1 - price / compareAtPrice) * 100);
}

/** "۴٫۸" — one decimal, Persian digits. */
export function formatRating(value: number): string {
  return toPersianDigits(value.toFixed(1)).replace(".", "٫");
}

/**
 * Normalizes an Iranian mobile number ("0912...", "912...", "+98912...",
 * or one typed with Persian digits) to E.164 ("+98912...").
 *
 * Deliberately plain ASCII — this is a technical identifier (sent to the
 * SMS provider, matched by Better Auth's phone plugin, stored in the
 * database), not something displayed to a person.
 */
export function normalizeIranPhone(input: string): string {
  const digits = toLatinDigits(input).replace(/\D/g, "");
  if (digits.startsWith("98")) return `+${digits}`;
  if (digits.startsWith("0")) return `+98${digits.slice(1)}`;
  return `+98${digits}`;
}

/** "+98912..." → "0912..." for display. */
export function phoneToLocal(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  return digits.startsWith("98") ? `0${digits.slice(2)}` : digits;
}

const IR_MOBILE = /^09\d{9}$/;
export function isIranMobile(input: string): boolean {
  return IR_MOBILE.test(phoneToLocal(normalizeIranPhone(input)));
}
