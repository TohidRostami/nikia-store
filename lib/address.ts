import { z } from "zod";
import { toLatinDigits } from "@/lib/format";

/** Trims and converts Persian/Arabic digits — Persian keyboards produce them by default. */
const latin = (s: unknown) => (typeof s === "string" ? toLatinDigits(s).trim() : s);

export const addressSchema = z.object({
  fullName: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(3, "نام و نام خانوادگی را کامل وارد کنید.").max(80),
  ),
  phone: z.preprocess(
    latin,
    z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)."),
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

/** Provinces offered in the checkout / address forms. */
export const IRAN_PROVINCES = [
  "آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام",
  "بوشهر", "تهران", "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی",
  "خراسان شمالی", "خوزستان", "زنجان", "سمنان", "سیستان و بلوچستان", "فارس",
  "قزوین", "قم", "کردستان", "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد",
  "گلستان", "گیلان", "لرستان", "مازندران", "مرکزی", "هرمزگان", "همدان", "یزد",
] as const;
