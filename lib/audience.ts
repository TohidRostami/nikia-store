import { isIranMobile, normalizeIranPhone, toLatinDigits } from "@/lib/format";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Accepts an email or an Iranian mobile number; returns it normalized, or null when it is neither. */
export function normalizeContact(input: string): string | null {
  const value = toLatinDigits(input).trim();
  if (!value || value.length > 120) return null;
  if (value.includes("@")) return EMAIL.test(value) ? value.toLowerCase() : null;
  return isIranMobile(value) ? normalizeIranPhone(value) : null;
}
