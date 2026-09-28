"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, CreditCard, ShoppingBag, Truck } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import { placeOrder } from "@/app/(shop)/checkout/actions";
import { addressSchema, IRAN_PROVINCES } from "@/lib/address";
import { siteConfig } from "@/lib/content";
import { computeDiscountAmount } from "@/lib/discount-calc";
import { formatToman, toPersianDigits } from "@/lib/format";
import { calcShipping, type ShippingRule } from "@/lib/shipping";
import { useCartStore } from "@/lib/store/cart";
import { useCartSync } from "@/lib/use-cart-sync";
import { cn } from "@/lib/utils";

export type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  postalCode: string;
  addressLine: string;
  isDefault: boolean;
};

const EMPTY_FORM = { fullName: "", phone: "", province: "تهران", city: "", postalCode: "", addressLine: "" };
type Form = typeof EMPTY_FORM;

const input =
  "h-12 w-full rounded-sm border border-line bg-white px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ink";

export function CheckoutFlow({
  defaultName,
  defaultPhone,
  addresses,
  shipping,
}: {
  defaultName: string;
  defaultPhone: string;
  addresses: SavedAddress[];
  shipping: ShippingRule;
}) {
  const { hydrated, items, status, checking } = useCartSync();
  const discount = useCartStore((s) => s.discountCode);

  const initial = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [step, setStep] = useState<1 | 2>(1);
  const [savedId, setSavedId] = useState<string | "new">(initial?.id ?? "new");
  const [form, setForm] = useState<Form>(
    initial
      ? { fullName: initial.fullName, phone: initial.phone, province: initial.province, city: initial.city, postalCode: initial.postalCode, addressLine: initial.addressLine }
      : { ...EMPTY_FORM, fullName: defaultName, phone: defaultPhone },
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = discount ? computeDiscountAmount(discount.type, discount.value, subtotal) : 0;
  const shippingCost = calcShipping(subtotal, shipping);
  const total = subtotal - discountAmount + shippingCost;
  const blocked = Object.values(status ?? {}).some((s) => !s.available || s.stock === 0);

  function pickSaved(id: string | "new") {
    setSavedId(id);
    setError(null);
    const a = addresses.find((x) => x.id === id);
    setForm(
      a
        ? { fullName: a.fullName, phone: a.phone, province: a.province, city: a.city, postalCode: a.postalCode, addressLine: a.addressLine }
        : { ...EMPTY_FORM, fullName: defaultName, phone: defaultPhone },
    );
  }

  function goToReview() {
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "اطلاعات آدرس را کامل کنید.");
      return;
    }
    setError(null);
    setForm({ ...parsed.data, phone: parsed.data.phone });
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function pay() {
    setLoading(true);
    setError(null);
    const result = await placeOrder(
      items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      form,
      discount?.code ?? null,
    );
    if ("error" in result) {
      setLoading(false);
      setError(result.error);
      return;
    }
    // The cart is cleared only once the payment succeeds (see the result
    // page), so a customer who backs out of the bank page still has it.
    window.location.href = result.redirectUrl;
  }

  if (!hydrated) return <Shell><div className="h-64 animate-pulse rounded-lg bg-sand" /></Shell>;

  if (items.length === 0) {
    return (
      <Shell>
        <EmptyState icon={ShoppingBag} title="سبد خرید شما خالی است" actionLabel="مشاهده محصولات" actionHref="/products" />
      </Shell>
    );
  }

  const steps = ["اطلاعات گیرنده و آدرس", "بازبینی و پرداخت", "تأیید سفارش"];

  return (
    <Shell>
      <ol className="mb-9 flex flex-wrap items-center gap-3 text-[13px]" aria-label="مراحل ثبت سفارش">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <li key={label} className="flex items-center gap-2.5" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border border-ink text-xs",
                  done || active ? "bg-ink text-paper" : "bg-transparent",
                )}
              >
                {done ? <Check className="size-3.5" /> : toPersianDigits(n)}
              </span>
              <span className={active ? "" : "text-muted-foreground"}>{label}</span>
              {n < steps.length && <span className="hidden h-px w-[clamp(16px,4vw,48px)] bg-line sm:block" />}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-start gap-[clamp(24px,4vw,48px)]">
        <div className="min-w-0 flex-[999_1_480px]">
          {step === 1 ? (
            <div className="flex flex-col gap-5">
              <h1 className="text-[clamp(22px,3vw,30px)] font-medium">اطلاعات گیرنده و آدرس</h1>

              {addresses.length > 0 && (
                <fieldset className="flex flex-col gap-2.5">
                  <legend className="mb-2.5 text-[13px]">آدرس‌های ذخیره‌شده</legend>
                  {addresses.map((a) => (
                    <Choice key={a.id} selected={savedId === a.id} onSelect={() => pickSaved(a.id)}>
                      <b className="text-sm font-medium">{a.fullName}</b>
                      <span className="text-xs text-muted-foreground">
                        {a.province}، {a.city}، {a.addressLine}
                      </span>
                    </Choice>
                  ))}
                  <Choice selected={savedId === "new"} onSelect={() => pickSaved("new")}>
                    <b className="text-sm font-medium">آدرس جدید</b>
                  </Choice>
                </fieldset>
              )}

              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                <Field label="نام و نام خانوادگی گیرنده">
                  <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoComplete="name" className={input} />
                </Field>
                <Field label="شماره موبایل">
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="numeric" autoComplete="tel" dir="ltr" placeholder="۰۹۱۲۳۴۵۶۷۸۹" className={cn(input, "text-right")} />
                </Field>
                <Field label="استان">
                  <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className={input}>
                    {IRAN_PROVINCES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label="شهر">
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} autoComplete="address-level2" className={input} />
                </Field>
              </div>
              <Field label="آدرس کامل">
                <textarea
                  rows={3}
                  value={form.addressLine}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  autoComplete="street-address"
                  className="w-full resize-y rounded-sm border border-line bg-white px-3.5 py-3 text-sm leading-[1.9] outline-none focus:border-ink"
                />
              </Field>
              <Field label="کد پستی (۱۰ رقم)">
                <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} inputMode="numeric" autoComplete="postal-code" dir="ltr" className={cn(input, "max-w-xs text-right")} />
              </Field>

              {error && <p role="alert" className="text-sm text-sale">{error}</p>}

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <Link href="/cart" className="flex items-center gap-2 py-3.5 text-sm">
                  <ArrowRight className="size-4" strokeWidth={1.5} /> بازگشت به سبد
                </Link>
                <button
                  type="button"
                  onClick={goToReview}
                  className="rounded-sm bg-ink px-9 py-3.5 text-sm text-paper transition-colors hover:bg-ink/90"
                >
                  ادامه: بازبینی و پرداخت
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[clamp(20px,2.6vw,26px)] font-medium">آدرس تحویل</h2>
                  <button type="button" onClick={() => setStep(1)} className="text-[13px] underline">
                    ویرایش
                  </button>
                </div>
                <div className="rounded-md border border-line bg-white p-[18px] text-sm leading-[2]">
                  <b className="font-medium">{form.fullName}</b> · <span className="font-nums">{toPersianDigits(form.phone)}</span>
                  <br />
                  {form.province}، {form.city}، {form.addressLine}
                  <br />
                  <span className="text-xs text-muted-foreground">کد پستی: {toPersianDigits(form.postalCode)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3.5">
                <h2 className="text-[clamp(20px,2.6vw,26px)] font-medium">روش ارسال</h2>
                <Choice selected icon={<Truck className="size-5" strokeWidth={1.4} />} trailing={shippingCost === 0 ? "رایگان" : formatToman(shippingCost)}>
                  <b className="text-sm font-medium">{siteConfig.checkout.shippingTitle}</b>
                  <span className="text-xs text-muted-foreground">{siteConfig.checkout.shippingEstimate}</span>
                </Choice>
              </div>

              <div className="flex flex-col gap-3.5">
                <h2 className="text-[clamp(20px,2.6vw,26px)] font-medium">روش پرداخت</h2>
                <Choice selected icon={<CreditCard className="size-5" strokeWidth={1.4} />}>
                  <b className="text-sm font-medium">{siteConfig.checkout.paymentTitle}</b>
                  <span className="text-xs text-muted-foreground">{siteConfig.checkout.paymentText}</span>
                </Choice>
              </div>

              {error && <p role="alert" className="text-sm text-sale">{error}</p>}
              {blocked && <p role="alert" className="text-sm text-sale">برخی کالاها دیگر موجود نیستند. لطفاً سبد خرید را اصلاح کنید.</p>}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 py-3.5 text-sm">
                  <ArrowRight className="size-4" strokeWidth={1.5} /> ویرایش آدرس
                </button>
                <button
                  type="button"
                  onClick={pay}
                  disabled={loading || checking || blocked}
                  className="rounded-sm bg-ink px-9 py-3.5 text-sm text-paper transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "در حال انتقال به درگاه…" : `پرداخت ${formatToman(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-[1_1_320px] flex-col gap-4 rounded-lg border border-hairline bg-white p-[clamp(20px,3vw,28px)] text-sm">
          <div className="text-[17px] font-semibold">سفارش شما</div>
          {items.map((l) => (
            <div key={l.variantId} className="flex items-center gap-3">
              <div className="relative h-[70px] w-14 shrink-0 overflow-hidden rounded-sm bg-sand">
                {l.image ? <Image src={l.image} alt="" fill sizes="56px" className="object-cover" /> : <ProductPlaceholder categorySlug={l.categorySlug} />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[13px]">{l.name}</span>
                <span className="text-xs text-muted-foreground">
                  {[l.color, l.size && `سایز ${toPersianDigits(l.size)}`, `${toPersianDigits(l.quantity)} عدد`].filter(Boolean).join(" · ")}
                </span>
              </div>
              <span className="text-[13px]">{formatToman(l.price * l.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-hairline pt-3.5">
            <span className="text-body">جمع کالاها</span>
            <span>{formatToman(subtotal)}</span>
          </div>
          {discount && discountAmount > 0 && (
            <div className="flex justify-between text-sale">
              <span>تخفیف</span>
              <span>−{formatToman(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-body">هزینه ارسال</span>
            <span>{shippingCost === 0 ? "رایگان" : formatToman(shippingCost)}</span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-3.5 text-base font-semibold">
            <span>مبلغ نهایی</span>
            <span>{formatToman(total)}</span>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1200px] px-4 pt-[clamp(28px,4vw,48px)] sm:px-6 lg:px-10">{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-[13px]">
      {label}
      {children}
    </label>
  );
}

function Choice({
  selected,
  onSelect,
  icon,
  trailing,
  children,
}: {
  selected: boolean;
  onSelect?: () => void;
  icon?: ReactNode;
  trailing?: string;
  children: ReactNode;
}) {
  const Comp = onSelect ? "button" : "div";
  return (
    <Comp
      {...(onSelect ? { type: "button" as const, onClick: onSelect, "aria-pressed": selected } : {})}
      className={cn(
        "flex items-center gap-3.5 rounded-md border bg-white p-[18px] text-right",
        selected ? "border-ink" : "border-line hover:border-ink/50",
      )}
    >
      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full border border-ink">
        <span className={cn("size-[9px] rounded-full", selected ? "bg-ink" : "bg-transparent")} />
      </span>
      {icon}
      <span className="flex flex-1 flex-col gap-1">{children}</span>
      {trailing && <span className="text-[13px]">{trailing}</span>}
    </Comp>
  );
}
