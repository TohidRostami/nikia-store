"use client";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  CreditCard,
  Mailbox,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import { TransitionLink } from "@/components/shared/transition-link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { placeOrder } from "@/app/(shop)/checkout/actions";
import {
  CHECKOUT_FIELD_ORDER,
  IRAN_PROVINCES,
  citiesOf,
  matchCity,
  matchProvince,
  validateCheckoutAddress,
  type CheckoutField,
  type FieldErrors,
} from "@/lib/address";
import { siteConfig } from "@/lib/content";
import { computeDiscountAmount } from "@/lib/discount-calc";
import { formatToman, toPersianDigits } from "@/lib/format";
import { persianDigits, withPersianDigits } from "@/lib/persian-input";
import {
  SHIPPING_COLLECT_LABEL,
  SHIPPING_COLLECT_NOTE,
  SHIPPING_METHODS,
  type ShippingMethodId,
} from "@/lib/shipping-methods";
import { useCartStore } from "@/lib/store/cart";
import { useCartSync } from "@/lib/use-cart-sync";
import { cn } from "@/lib/utils";

export type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  landline: string;
  province: string;
  city: string;
  postalCode: string;
  addressLine: string;
  isDefault: boolean;
};

type Form = Record<CheckoutField, string>;

const EMPTY_FORM: Form = {
  fullName: "",
  phone: "",
  landline: "",
  province: "",
  city: "",
  postalCode: "",
  addressLine: "",
};

/** Addresses saved before the dropdowns existed have a free-text city — map them onto the lists, or leave the field empty to be picked again. */
function formFromAddress(a: SavedAddress): Form {
  const province = matchProvince(a.province);
  return {
    fullName: a.fullName,
    phone: withPersianDigits(a.phone),
    landline: withPersianDigits(a.landline),
    province,
    city: province ? matchCity(province, a.city) : "",
    postalCode: withPersianDigits(a.postalCode),
    addressLine: withPersianDigits(a.addressLine),
  };
}

/** Fields where a typed digit becomes a Persian digit (never the name: digits are an error there). */
const DIGIT_FIELDS: CheckoutField[] = [
  "phone",
  "landline",
  "postalCode",
  "addressLine",
];

/** The validated (Latin-digit, trimmed) address in the shape the server action takes. */
function toAddressFields(d: {
  fullName: string;
  phone: string;
  landline?: string;
  province: string;
  city: string;
  postalCode: string;
  addressLine: string;
}) {
  return {
    fullName: d.fullName,
    phone: d.phone,
    landline: d.landline ?? "",
    province: d.province,
    city: d.city,
    postalCode: d.postalCode,
    addressLine: d.addressLine,
  };
}

const FORM_ID = "checkout-address-form";

const input =
  "h-12 w-full rounded-sm border border-line bg-white px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ink";
const invalidField = "border-sale focus:border-sale";
// The shared Select, sized and coloured like the text inputs next to it.
const selectTrigger =
  "data-[size=default]:h-12 rounded-sm border-line bg-white text-sm hover:border-ink aria-invalid:border-sale data-[placeholder]:text-muted-foreground";

const SHIPPING_ICONS: Record<ShippingMethodId, ReactNode> = {
  POST: <Mailbox className="size-5" strokeWidth={1.4} />,
  TIPAX: <Truck className="size-5" strokeWidth={1.4} />,
};

const STEPS = ["اطلاعات گیرنده و آدرس", "بازبینی و پرداخت", "تأیید سفارش"];

export function CheckoutFlow({
  defaultName,
  defaultPhone,
  addresses,
}: {
  defaultName: string;
  defaultPhone: string;
  addresses: SavedAddress[];
}) {
  const { hydrated, items, status, checking } = useCartSync();
  const discount = useCartStore((s) => s.discountCode);

  const initial = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [step, setStep] = useState<1 | 2>(1);
  const [savedId, setSavedId] = useState<string | "new">(initial?.id ?? "new");
  const [form, setForm] = useState<Form>(() =>
    initial
      ? formFromAddress(initial)
      : {
          ...EMPTY_FORM,
          fullName: defaultName,
          phone: withPersianDigits(defaultPhone),
        },
  );
  // A field's error is shown once the customer has left it, or after pressing "continue".
  const [touched, setTouched] = useState<
    Partial<Record<CheckoutField, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Chosen on the review step. Required, with no default: which carrier delivers is a real decision.
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId | null>(
    null,
  );
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Validation is a pure function of the form — nothing to keep in sync.
  const validation = useMemo(() => validateCheckoutAddress(form), [form]);
  const errors: FieldErrors = validation.ok ? {} : validation.errors;
  const errorCount = Object.keys(errors).length;
  const visible = (field: CheckoutField) =>
    submitted || touched[field] ? errors[field] : undefined;

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = discount
    ? computeDiscountAmount(discount.type, discount.value, subtotal)
    : 0;
  // Both carriers are پس‌کرایه: shipping is paid to them on delivery, so only the goods are paid online.
  const total = subtotal - discountAmount;
  const blocked = Object.values(status ?? {}).some(
    (s) => !s.available || s.stock === 0,
  );

  function setField(field: CheckoutField, value: string) {
    // Changing the province empties the city: the old one belongs to another province.
    setForm((f) =>
      field === "province"
        ? { ...f, province: value, city: "" }
        : { ...f, [field]: value },
    );
    if (field === "province")
      setTouched((t) => ({ ...t, province: true, city: false }));
  }

  function markTouched(field: CheckoutField) {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }

  /** Props every field shares: id, value, change/blur handlers and the accessibility wiring for its error. */
  function control(field: CheckoutField) {
    const message = visible(field);
    return {
      id: `ck-${field}`,
      value: form[field],
      ...(DIGIT_FIELDS.includes(field)
        ? persianDigits((v) => setField(field, v))
        : {
            onChange: (
              e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
            ) => setField(field, e.target.value),
          }),
      onBlur: () => markTouched(field),
      "aria-invalid": message ? (true as const) : undefined,
      "aria-describedby": message ? `ck-${field}-error` : undefined,
    };
  }

  function pickShipping(id: ShippingMethodId) {
    setShippingMethod(id);
    setShippingError(null);
  }

  function pickSaved(id: string | "new") {
    setSavedId(id);
    setError(null);
    setTouched({});
    setSubmitted(false);
    const a = addresses.find((x) => x.id === id);
    setForm(
      a
        ? formFromAddress(a)
        : {
            ...EMPTY_FORM,
            fullName: defaultName,
            phone: withPersianDigits(defaultPhone),
          },
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!validation.ok) {
      // Take the customer to the first problem — on a phone the form may be far above the button.
      const first = CHECKOUT_FIELD_ORDER.find((f) => errors[f]);
      if (first) document.getElementById(`ck-${first}`)?.focus();
      return;
    }
    const d = validation.data;
    setForm({
      fullName: d.fullName,
      phone: withPersianDigits(d.phone ?? ""),
      landline: withPersianDigits(d.landline ?? ""),
      province: d.province,
      city: d.city,
      postalCode: withPersianDigits(d.postalCode),
      addressLine: d.addressLine,
    });
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function pay() {
    // The inputs show Persian digits; the server gets the validated, normalised address.
    if (!validation.ok) {
      setStep(1);
      return;
    }
    if (!shippingMethod) {
      setShippingError("روش ارسال را انتخاب کنید.");
      document.getElementById(`ck-ship-${SHIPPING_METHODS[0].id}`)?.focus();
      return;
    }
    setLoading(true);
    setError(null);
    const result = await placeOrder(
      items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      toAddressFields(validation.data),
      shippingMethod,
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

  if (!hydrated)
    return (
      <Shell>
        <div className="h-64 animate-pulse rounded-lg bg-sand" />
      </Shell>
    );

  if (items.length === 0) {
    return (
      <Shell>
        <EmptyState
          icon={ShoppingBag}
          title="سبد خرید شما خالی است"
          actionLabel="مشاهده محصولات"
          actionHref="/products"
        />
      </Shell>
    );
  }

  const backClass =
    "inline-flex items-center gap-2 py-2 text-sm transition-colors hover:text-muted-foreground";

  return (
    <Shell>
      <div className="mb-5">
        {step === 1 ? (
          <TransitionLink href="/cart" className={backClass}>
            <ArrowRight className="size-4" strokeWidth={1.5} /> بازگشت به سبد
            خرید
          </TransitionLink>
        ) : (
          <button
            type="button"
            onClick={() => setStep(1)}
            className={backClass}
          >
            <ArrowRight className="size-4" strokeWidth={1.5} /> ویرایش آدرس
          </button>
        )}
      </div>

      {/* Full width: the first two steps stretch, and the line after each one fills the space up to the next. */}
      <ol
        className="mb-9 flex w-full items-center text-[13px]"
        aria-label="مراحل ثبت سفارش"
      >
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          const last = n === STEPS.length;
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className={cn("flex items-center", !last && "flex-1")}
            >
              <span className="flex shrink-0 items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border border-ink text-xs",
                    done || active ? "bg-ink text-paper" : "bg-transparent",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : toPersianDigits(n)}
                </span>
                {/* On a phone only the current step keeps its label, so all three fit on one line. */}
                <span
                  className={cn(
                    "whitespace-nowrap",
                    active ? "" : "hidden text-muted-foreground sm:inline",
                  )}
                >
                  {label}
                </span>
              </span>
              {!last && (
                <span
                  aria-hidden="true"
                  className="mx-3 h-px min-w-4 flex-1 bg-line sm:mx-4"
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-start gap-[clamp(24px,4vw,48px)]">
        <div className="min-w-0 flex-[999_1_480px]">
          {step === 1 ? (
            <form
              id={FORM_ID}
              noValidate
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              <h1 className="text-[clamp(22px,3vw,30px)] font-medium">
                اطلاعات گیرنده و آدرس
              </h1>

              {addresses.length > 0 && (
                <fieldset className="flex flex-col gap-2.5">
                  <legend className="mb-2.5 text-[13px]">
                    آدرس‌های ذخیره‌شده
                  </legend>
                  {addresses.map((a) => (
                    <Choice
                      key={a.id}
                      selected={savedId === a.id}
                      onSelect={() => pickSaved(a.id)}
                    >
                      <b className="text-sm font-medium">{a.fullName}</b>
                      <span className="text-xs text-muted-foreground">
                        {a.province}، {a.city}، {a.addressLine}
                      </span>
                    </Choice>
                  ))}
                  <Choice
                    selected={savedId === "new"}
                    onSelect={() => pickSaved("new")}
                  >
                    <b className="text-sm font-medium">آدرس جدید</b>
                  </Choice>
                </fieldset>
              )}

              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                <Field
                  label="نام و نام خانوادگی گیرنده"
                  htmlFor="ck-fullName"
                  error={visible("fullName")}
                >
                  <input
                    {...control("fullName")}
                    autoComplete="name"
                    className={cn(input, visible("fullName") && invalidField)}
                  />
                </Field>

                <Field
                  label="شماره موبایل"
                  htmlFor="ck-phone"
                  error={visible("phone")}
                >
                  <input
                    {...control("phone")}
                    inputMode="numeric"
                    autoComplete="tel"
                    dir="ltr"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className={cn(
                      input,
                      "text-right",
                      visible("phone") && invalidField,
                    )}
                  />
                </Field>

                <Field
                  label="تلفن ثابت (اختیاری، با کد شهر)"
                  htmlFor="ck-landline"
                  error={visible("landline")}
                >
                  <input
                    {...control("landline")}
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="۰۲۱۸۸۱۲۳۴۵۶"
                    className={cn(
                      input,
                      "text-right",
                      visible("landline") && invalidField,
                    )}
                  />
                </Field>

                <Field
                  label="استان"
                  htmlFor="ck-province"
                  error={visible("province")}
                >
                  <Select
                    value={form.province}
                    onValueChange={(v) => setField("province", v)}
                    onOpenChange={(open) => !open && markTouched("province")}
                  >
                    <SelectTrigger
                      id="ck-province"
                      aria-invalid={visible("province") ? true : undefined}
                      aria-describedby={
                        visible("province") ? "ck-province-error" : undefined
                      }
                      className={selectTrigger}
                      dir="rtl"
                    >
                      <SelectValue placeholder="استان را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {IRAN_PROVINCES.map((p) => (
                        <SelectItem
                          className="justify-end text-right"
                          key={p}
                          value={p}
                        >
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="شهر" htmlFor="ck-city" error={visible("city")}>
                  <Select
                    value={form.city}
                    onValueChange={(v) => setField("city", v)}
                    onOpenChange={(open) => !open && markTouched("city")}
                    disabled={!form.province}
                  >
                    <SelectTrigger
                      id="ck-city"
                      aria-invalid={visible("city") ? true : undefined}
                      aria-describedby={
                        visible("city") ? "ck-city-error" : undefined
                      }
                      className={selectTrigger}
                      dir="rtl"
                    >
                      <SelectValue
                        placeholder={
                          form.province
                            ? "شهر را انتخاب کنید"
                            : "ابتدا استان را انتخاب کنید"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {citiesOf(form.province).map((c) => (
                        <SelectItem
                          className="justify-end text-right"
                          key={c}
                          value={c}
                        >
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label="کد پستی (۱۰ رقم)"
                  htmlFor="ck-postalCode"
                  error={visible("postalCode")}
                >
                  <input
                    {...control("postalCode")}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    dir="ltr"
                    className={cn(
                      input,
                      "text-right",
                      visible("postalCode") && invalidField,
                    )}
                  />
                </Field>
              </div>

              <Field
                label="آدرس کامل"
                htmlFor="ck-addressLine"
                error={visible("addressLine")}
              >
                <textarea
                  {...control("addressLine")}
                  rows={3}
                  autoComplete="street-address"
                  className={cn(
                    "w-full resize-y rounded-sm border border-line bg-white px-3.5 py-3 text-sm leading-[1.9] outline-none focus:border-ink",
                    visible("addressLine") && invalidField,
                  )}
                />
              </Field>
            </form>
          ) : (
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[clamp(20px,2.6vw,26px)] font-medium">
                    آدرس تحویل
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[13px] underline"
                  >
                    ویرایش
                  </button>
                </div>
                <div className="rounded-md border border-line bg-white p-[18px] text-sm leading-[2]">
                  <b className="font-medium">{form.fullName}</b> ·{" "}
                  <span className="font-nums">
                    {toPersianDigits(form.phone)}
                  </span>
                  <br />
                  {form.province}، {form.city}، {form.addressLine}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    کد پستی: {toPersianDigits(form.postalCode)} · تلفن ثابت:{" "}
                    <span className="font-nums">
                      {toPersianDigits(form.landline)}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3.5">
                <h2 className="text-[clamp(20px,2.6vw,26px)] font-medium">
                  روش ارسال
                </h2>
                <div
                  role="group"
                  aria-label="روش ارسال"
                  aria-describedby={
                    shippingError ? "ck-shipping-error" : undefined
                  }
                  className="flex flex-col gap-3"
                >
                  {SHIPPING_METHODS.map((m) => (
                    <Choice
                      key={m.id}
                      id={`ck-ship-${m.id}`}
                      selected={shippingMethod === m.id}
                      onSelect={() => pickShipping(m.id)}
                      icon={SHIPPING_ICONS[m.id]}
                      trailing={SHIPPING_COLLECT_LABEL}
                      invalid={Boolean(shippingError)}
                    >
                      <b className="text-sm font-medium">{m.title}</b>
                      <span className="text-xs text-muted-foreground">
                        {m.description}
                      </span>
                    </Choice>
                  ))}
                </div>
                <p className="rounded-md bg-sand p-3.5 text-xs leading-7 text-body">
                  {SHIPPING_COLLECT_NOTE}
                </p>
                {shippingError && (
                  <p
                    id="ck-shipping-error"
                    role="alert"
                    className="text-sm text-sale"
                  >
                    {shippingError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3.5">
                <h2 className="text-[clamp(20px,2.6vw,26px)] font-medium">
                  روش پرداخت
                </h2>
                <Choice
                  selected
                  icon={<CreditCard className="size-5" strokeWidth={1.4} />}
                >
                  <b className="text-sm font-medium">
                    {siteConfig.checkout.paymentTitle}
                  </b>
                  <span className="text-xs text-muted-foreground">
                    {siteConfig.checkout.paymentText}
                  </span>
                </Choice>
              </div>
            </div>
          )}
        </div>

        {/* On large screens the summary stays in view while the form scrolls, so the button is always reachable. */}
        <aside className="flex flex-[1_1_320px] flex-col gap-4 rounded-lg border border-hairline bg-white p-[clamp(20px,3vw,28px)] text-sm lg:sticky lg:top-28">
          <div className="text-[17px] font-semibold">سفارش شما</div>
          <div className="flex flex-col gap-4 lg:max-h-[min(38vh,340px)] lg:overflow-y-auto">
            {items.map((l) => (
              <div key={l.variantId} className="flex items-center gap-3">
                <div className="relative h-[70px] w-14 shrink-0 overflow-hidden rounded-sm bg-sand">
                  {l.image ? (
                    <Image
                      src={l.image}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <ProductPlaceholder categorySlug={l.categorySlug} />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[13px]">{l.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {[
                      l.color,
                      l.size && `سایز ${toPersianDigits(l.size)}`,
                      `${toPersianDigits(l.quantity)} عدد`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <span className="text-[13px]">
                  {formatToman(l.price * l.quantity)}
                </span>
              </div>
            ))}
          </div>
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
            <span>{SHIPPING_COLLECT_LABEL}</span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-3.5 text-base font-semibold">
            <span>مبلغ قابل پرداخت</span>
            <span>{formatToman(total)}</span>
          </div>
          <p className="-mt-1 text-xs leading-6 text-muted-foreground">
            هزینه‌ی ارسال در این مبلغ نیست؛ هنگام تحویل مرسوله به پست یا تیپاکس
            پرداخت می‌شود.
          </p>

          <div className="flex flex-col gap-2.5">
            {step === 2 && error && (
              <p role="alert" className="text-sm text-sale">
                {error}
              </p>
            )}
            {step === 2 && blocked && (
              <p role="alert" className="text-sm text-sale">
                برخی کالاها دیگر موجود نیستند. لطفاً سبد خرید را اصلاح کنید.
              </p>
            )}

            {step === 1 ? (
              <>
                {/* Outside the <form> on purpose (it lives in the summary) — the form attribute ties it back. */}
                <Button
                  type="submit"
                  form={FORM_ID}
                  size="lg"
                  className="w-full"
                >
                  ادامه: بازبینی و پرداخت
                </Button>
                {submitted && errorCount > 0 && (
                  <p
                    role="alert"
                    className="text-center text-xs leading-6 text-sale"
                  >
                    لطفاً {toPersianDigits(errorCount)} مورد خطای فرم را برطرف
                    کنید.
                  </p>
                )}
              </>
            ) : (
              <Button
                type="button"
                onClick={pay}
                disabled={loading || checking || blocked}
                size="lg"
                className="w-full"
              >
                {loading
                  ? "در حال انتقال به درگاه…"
                  : `پرداخت ${formatToman(total)}`}
              </Button>
            )}
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-[clamp(28px,4vw,48px)] sm:px-6 lg:px-10">
      {children}
    </div>
  );
}

/** A label, the control, and — when there is one — its error message, linked for screen readers via aria-describedby. */
function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={htmlFor} className="text-[13px]">
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-xs leading-6 text-sale"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function Choice({
  id,
  selected,
  onSelect,
  icon,
  trailing,
  invalid,
  children,
}: {
  id?: string;
  selected: boolean;
  onSelect?: () => void;
  icon?: ReactNode;
  trailing?: string;
  /** Nothing from this group has been chosen yet and the customer tried to go on. */
  invalid?: boolean;
  children: ReactNode;
}) {
  const Comp = onSelect ? "button" : "div";
  return (
    <Comp
      id={id}
      {...(onSelect
        ? {
            type: "button" as const,
            onClick: onSelect,
            "aria-pressed": selected,
          }
        : {})}
      className={cn(
        "flex items-center gap-3.5 rounded-md border bg-white p-[18px] text-right",
        selected
          ? "border-ink"
          : invalid
            ? "border-sale"
            : "border-line hover:border-ink/50",
      )}
    >
      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full border border-ink">
        <span
          className={cn(
            "size-[9px] rounded-full",
            selected ? "bg-ink" : "bg-transparent",
          )}
        />
      </span>
      {icon}
      <span className="flex flex-1 flex-col gap-1">{children}</span>
      {trailing && <span className="text-[13px]">{trailing}</span>}
    </Comp>
  );
}
