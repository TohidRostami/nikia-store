import { z } from "zod";
import { toLatinDigits } from "@/lib/format";
import { IRAN_PROVINCES, citiesOf } from "@/lib/iran-cities";

export { IRAN_PROVINCES, IRAN_CITIES, citiesOf } from "@/lib/iran-cities";

/** Trims and converts Persian/Arabic digits — Persian keyboards produce them by default. */
const latin = (s: unknown) =>
  typeof s === "string" ? toLatinDigits(s).trim() : s;

/* ─────────────────── matching saved (free-text) addresses ─────────────────── */

/** Loose comparison key: Arabic ي/ك folded, ZWNJ and spaces ignored. */
const foldKey = (s: string) =>
  s
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\s]/g, "");

/**
 * The canonical name of a province, or "" when it isn't one of the 31. Used to
 * pre-fill the dropdowns from addresses saved before they existed, when the
 * city was free text.
 */
export function matchProvince(name: string): string {
  return IRAN_PROVINCES.find((p) => foldKey(p) === foldKey(name)) ?? "";
}

/** The canonical name of a city within a province, or "" when it isn't listed. */
export function matchCity(province: string, name: string): string {
  return citiesOf(province).find((c) => foldKey(c) === foldKey(name)) ?? "";
}

/* ───────────────────────── phone-number helpers ───────────────────────── */

/**
 * Digits only: Persian/Arabic digits become Latin, and the spaces, dashes and
 * brackets people type ("021-8812 3456") are dropped. "+98…" / "0098…" become
 * a leading 0, so "+989121234567" is accepted as 09121234567.
 */
export function normalizeIranNumber(value: unknown): unknown {
  if (typeof value !== "string") return value;
  let s = toLatinDigits(value).replace(/[\s\-().\u200c]/g, "");
  if (s.startsWith("+98")) s = "0" + s.slice(3);
  else if (s.startsWith("0098")) s = "0" + s.slice(4);
  return s;
}

/** Mobile: 09 + 9 digits. */
export const MOBILE_PATTERN = /^09\d{9}$/;
/**
 * Landline: 0 + area code + number = 11 digits in total (021 + 8 digits,
 * 0341 + 7 digits, …). The second digit is 1–8; a 9 would be a mobile number.
 */
export const LANDLINE_PATTERN = /^0[1-8]\d{9}$/;
/**
 * Iranian postal code: 10 digits where the first five never contain 0 or 2
 * (the 5th also never 5), the rest never contain 2, and the first four digits
 * aren't all the same. Same rule validator.js uses for its "IR" locale.
 */
export const POSTAL_CODE_PATTERN = /^(?!(\d)\1{3})[13-9]{4}[1346-9][013-9]{5}$/;

/* ───────────────────── account addresses (loose rules) ───────────────────── */

export const addressSchema = z.object({
  fullName: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(3, "نام و نام خانوادگی را کامل وارد کنید.").max(80),
  ),
  phone: z.preprocess(
    latin,
    z
      .string()
      .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)."),
  ),
  // Optional here — the account page doesn't ask for it. Checkout does (below).
  landline: z.preprocess(
    (v) => (v === "" || v === null ? undefined : normalizeIranNumber(v)),
    z
      .string()
      .regex(
        LANDLINE_PATTERN,
        "تلفن ثابت را با کد شهر وارد کنید (مثال: ۰۲۱۸۸۱۲۳۴۵۶).",
      )
      .optional(),
  ),
  province: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(2, "استان را وارد کنید.").max(60),
  ),
  city: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(2, "شهر را وارد کنید.").max(60),
  ),
  postalCode: z.preprocess(
    latin,
    z.string().regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد."),
  ),
  addressLine: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(10, "آدرس کامل را دقیق‌تر بنویسید.").max(400),
  ),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

/* ───────────────────── checkout (strict, per-field messages) ───────────────────── */

/** Trim + collapse spaces. A missing/null value counts as empty, so the "required" message is the one reported. */
const text = (v: unknown) =>
  v == null ? "" : typeof v === "string" ? v.trim().replace(/\s+/g, " ") : v;
/** Same idea for phone numbers. */
const phoneText = (v: unknown) => normalizeIranNumber(v ?? "");

/** Letters of any script, plus space, ZWNJ and the few marks that occur in real names. */
const NAME_CHARS = /^[\p{L}\p{M}\u200c .'-]+$/u;

/**
 * Every message below is shown under its own field, so each one says what to
 * do. The first check on each field is the "required" one: for an empty value
 * it is the first issue reported, which is the one the form displays.
 *
 * Used both by the checkout form (live, in the browser) and by createOrder()
 * (the server never trusts the browser).
 */
export const checkoutAddressSchema = addressSchema
  .extend({
    fullName: z.preprocess(
      text,
      z
        .string()
        .min(1, "نام و نام خانوادگی را وارد کنید.")
        .max(80, "نام و نام خانوادگی بیش از حد طولانی است (حداکثر ۸۰ حرف).")
        .refine(
          (v) => v === "" || NAME_CHARS.test(v),
          "نام فقط می‌تواند شامل حروف باشد.",
        )
        .refine(
          (v) => v === "" || v.split(" ").length >= 2,
          "نام و نام خانوادگی را کامل وارد کنید (مثلاً: سارا محمدی).",
        ),
    ),
    phone: z.preprocess(
      phoneText,
      z
        .string()
        .min(1, "شماره موبایل را وارد کنید.")
        .regex(
          MOBILE_PATTERN,
          "شماره موبایل معتبر نیست؛ باید با ۰۹ شروع شود و ۱۱ رقم باشد (مثال: ۰۹۱۲۳۴۵۶۷۸۹).",
        ),
    ),
    // Optional: left empty it is simply not saved (undefined → NULL in the database).
    // But anything that IS typed must be a real landline, not a mobile number or a typo.
    landline: z.preprocess(
      phoneText,
      z
        .string()
        .refine(
          (v) => !v.startsWith("09"),
          "این شماره موبایل است؛ تلفن ثابت را همراه با کد شهر وارد کنید (مثال: ۰۲۱۸۸۱۲۳۴۵۶).",
        )
        .refine(
          (v) => v === "" || LANDLINE_PATTERN.test(v),
          "تلفن ثابت را همراه با کد شهر و فقط با رقم وارد کنید (مثال: ۰۲۱۸۸۱۲۳۴۵۶).",
        )
        .transform((v) => (v === "" ? undefined : v)),
    ),
    province: z.preprocess(
      text,
      z
        .string()
        .min(1, "استان را انتخاب کنید.")
        .refine(
          (v) => v === "" || IRAN_PROVINCES.includes(v),
          "استان انتخاب‌شده معتبر نیست؛ دوباره انتخاب کنید.",
        ),
    ),
    city: z.preprocess(text, z.string().min(1, "شهر را انتخاب کنید.")),
    postalCode: z.preprocess(
      (v) =>
        v == null
          ? ""
          : typeof v === "string"
            ? toLatinDigits(v).replace(/[\s\-\u200c]/g, "")
            : v,
      z
        .string()
        .min(1, "کد پستی را وارد کنید.")
        .regex(/^\d{10}$/, "کد پستی باید دقیقاً ۱۰ رقم باشد.")
        .regex(
          POSTAL_CODE_PATTERN,
          "این کد پستی معتبر نیست؛ لطفاً دوباره بررسی کنید.",
        ),
    ),
    addressLine: z.preprocess(
      text,
      z
        .string()
        .min(1, "آدرس را وارد کنید.")
        .min(10, "آدرس کامل را دقیق‌تر بنویسید (حداقل ۱۰ حرف).")
        .max(400, "آدرس بیش از حد طولانی است (حداکثر ۴۰۰ حرف)."),
    ),
  })
  .superRefine((a, ctx) => {
    // A city must belong to the chosen province — the browser's dropdown
    // guarantees it, this stops a hand-made request from sending a mismatch.
    if (
      a.city &&
      IRAN_PROVINCES.includes(a.province) &&
      !citiesOf(a.province).includes(a.city)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["city"],
        message: "این شهر در استان انتخاب‌شده وجود ندارد؛ دوباره انتخاب کنید.",
      });
    }
  });

export type CheckoutAddressInput = z.infer<typeof checkoutAddressSchema>;

export type CheckoutField =
  | "fullName"
  | "phone"
  | "landline"
  | "province"
  | "city"
  | "postalCode"
  | "addressLine";
export type FieldErrors = Partial<Record<CheckoutField, string>>;

/** Top-to-bottom order of the checkout fields — used to focus the first invalid one. */
export const CHECKOUT_FIELD_ORDER: CheckoutField[] = [
  "fullName",
  "phone",
  "landline",
  "province",
  "city",
  "postalCode",
  "addressLine",
];

/**
 * The checkout form's validation: normalised data when valid, otherwise one
 * message per invalid field (the first one that applies to it).
 */
export function validateCheckoutAddress(
  input: unknown,
):
  | { ok: true; data: CheckoutAddressInput }
  | { ok: false; errors: FieldErrors } {
  const parsed = checkoutAddressSchema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };

  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as CheckoutField | undefined;
    if (field && !(field in errors)) errors[field] = issue.message;
  }
  return { ok: false, errors };
}
