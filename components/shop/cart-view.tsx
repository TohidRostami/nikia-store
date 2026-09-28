"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import { applyDiscountCode } from "@/app/(shop)/cart/actions";
import { computeDiscountAmount } from "@/lib/discount-calc";
import { formatPrice, formatToman, toPersianDigits } from "@/lib/format";
import { calcShipping, type ShippingRule } from "@/lib/shipping";
import { useCartStore } from "@/lib/store/cart";
import { maxQuantity, useCartSync } from "@/lib/use-cart-sync";

export function CartView({ shipping }: { shipping: ShippingRule }) {
  const { hydrated, items, status, checking } = useCartSync();
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const discount = useCartStore((s) => s.discountCode);
  const setDiscount = useCartStore((s) => s.setDiscountCode);

  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [applying, setApplying] = useState(false);

  const lines = items.map((item) => ({ item, s: status?.[item.variantId] }));
  const hasUnavailable = lines.some(({ s }) => s && (!s.available || s.stock === 0));
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = discount ? computeDiscountAmount(discount.type, discount.value, subtotal) : 0;
  const shippingCost = items.length > 0 ? calcShipping(subtotal, shipping) : 0;
  const total = subtotal - discountAmount + shippingCost;
  const count = items.reduce((n, i) => n + i.quantity, 0);

  // Keep an applied code honest as the cart changes (minimum order, etc.).
  const appliedCode = discount?.code;
  useEffect(() => {
    if (!appliedCode || subtotal === 0) return;
    let alive = true;
    applyDiscountCode(appliedCode, subtotal).then((r) => {
      if (!alive) return;
      const { setDiscountCode } = useCartStore.getState();
      if (!r.valid) {
        setDiscountCode(null);
        setMessage({ text: r.error, ok: false });
      } else {
        setDiscountCode({ id: r.id, code: r.code, type: r.type, value: r.value });
      }
    });
    return () => {
      alive = false;
    };
  }, [appliedCode, subtotal]);

  async function apply() {
    if (!code.trim()) return;
    setApplying(true);
    const r = await applyDiscountCode(code, subtotal);
    setApplying(false);
    if (!r.valid) {
      setMessage({ text: r.error, ok: false });
      return;
    }
    setDiscount({ id: r.id, code: r.code, type: r.type, value: r.value });
    setCode("");
    setMessage({ text: `کد ${r.code} اعمال شد.`, ok: true });
  }

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:px-10">
        <h1 className="mb-8 text-[clamp(28px,4vw,40px)] font-normal">سبد خرید</h1>
        <div className="h-64 animate-pulse rounded-lg bg-sand" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-[clamp(28px,4vw,48px)] sm:px-6 lg:px-10">
      <h1 className="mb-2 text-[clamp(28px,4vw,40px)] font-normal">سبد خرید</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {items.length === 0 ? "سبد شما خالی است" : `${toPersianDigits(count)} کالا در سبد شما`}
      </p>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="سبد خرید شما خالی است"
          description="سری به کالکشن جدید بزنید."
          actionLabel="رفتن به فروشگاه"
          actionHref="/products"
        />
      ) : (
        <div className="flex flex-wrap items-start gap-[clamp(24px,4vw,48px)]">
          <div className="flex min-w-0 flex-[999_1_480px] flex-col">
            {shipping.freeShippingThreshold != null && (
              <FreeShippingBar subtotal={subtotal} threshold={shipping.freeShippingThreshold} />
            )}

            {lines.map(({ item, s }) => {
              const unavailable = s && (!s.available || s.stock === 0);
              const max = maxQuantity(s);
              return (
                <div key={item.variantId} className="flex gap-[18px] border-b border-[#e2dace] py-[22px]">
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative block aspect-[4/5] flex-[0_0_clamp(88px,14vw,120px)] overflow-hidden rounded-md bg-sand"
                  >
                    {item.image ? (
                      <Image src={item.image} alt="" fill sizes="120px" className={unavailable ? "object-cover opacity-50" : "object-cover"} />
                    ) : (
                      <ProductPlaceholder categorySlug={item.categorySlug} />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/products/${item.slug}`} className="text-[15px] font-medium">
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        aria-label={`حذف ${item.name}`}
                        className="p-1 text-muted-foreground transition-colors hover:text-ink"
                      >
                        <Trash2 className="size-[18px]" strokeWidth={1.5} />
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {[item.color && `رنگ: ${item.color}`, item.size && `سایز: ${toPersianDigits(item.size)}`].filter(Boolean).join(" · ")}
                    </span>
                    {unavailable && (
                      <span className="flex items-center gap-1.5 text-xs text-sale">
                        <AlertTriangle className="size-3.5" />
                        {s && !s.available ? "این کالا دیگر موجود نیست؛ لطفاً آن را حذف کنید." : "موجودی این سایز تمام شده؛ لطفاً آن را حذف کنید."}
                      </span>
                    )}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                      <div className="flex h-10 items-center rounded-sm border border-line bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.variantId, Math.min(max, item.quantity + 1))}
                          disabled={Boolean(unavailable) || item.quantity >= max}
                          aria-label="افزایش تعداد"
                          className="flex h-full w-[38px] items-center justify-center disabled:opacity-30"
                        >
                          <Plus className="size-4" strokeWidth={1.5} />
                        </button>
                        <span className="min-w-[22px] text-center text-sm" aria-live="polite">
                          {toPersianDigits(item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                          aria-label="کاهش تعداد"
                          className="flex h-full w-[38px] items-center justify-center"
                        >
                          <Minus className="size-4" strokeWidth={1.5} />
                        </button>
                      </div>
                      <span className="text-[15px] font-semibold">{formatToman(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <Link href="/products" className="mt-5 flex items-center gap-2 text-[13px] hover:text-muted-foreground">
              <ArrowRight className="size-4" strokeWidth={1.5} />
              ادامه خرید
            </Link>
          </div>

          <aside className="flex flex-[1_1_320px] flex-col gap-4 rounded-lg border border-hairline bg-white p-[clamp(20px,3vw,28px)] text-sm">
            <div className="text-[17px] font-semibold">خلاصه سفارش</div>
            <Row label="جمع کالاها" value={formatToman(subtotal)} />
            {discount && discountAmount > 0 && (
              <div className="flex justify-between text-sale">
                <span className="flex items-center gap-2">
                  تخفیف کد <span className="font-nums">{discount.code}</span>
                  <button type="button" onClick={() => setDiscount(null)} className="text-xs underline">
                    حذف
                  </button>
                </span>
                <span>−{formatToman(discountAmount)}</span>
              </div>
            )}
            <Row label="هزینه ارسال" value={shippingCost === 0 ? "رایگان" : formatToman(shippingCost)} />

            {!discount && (
              <div>
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void apply()}
                    placeholder="کد تخفیف"
                    dir="ltr"
                    aria-label="کد تخفیف"
                    className="h-11 min-w-0 flex-1 rounded-sm border border-line bg-paper px-3 text-right text-[13px] outline-none focus:border-ink"
                  />
                  <button
                    type="button"
                    onClick={() => void apply()}
                    disabled={applying || !code.trim()}
                    className="rounded-sm border border-ink px-4 text-[13px] transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
                  >
                    {applying ? "…" : "اعمال"}
                  </button>
                </div>
              </div>
            )}
            {message && (
              <span role="status" className={`-mt-1.5 text-xs ${message.ok ? "text-success" : "text-sale"}`}>
                {message.text}
              </span>
            )}

            <div className="flex justify-between border-t border-hairline pt-4 text-base font-semibold">
              <span>مبلغ قابل پرداخت</span>
              <span>{formatToman(total)}</span>
            </div>

            {hasUnavailable || checking ? (
              <span
                aria-disabled="true"
                className="cursor-not-allowed rounded-sm bg-line py-4 text-center text-[15px] text-muted-foreground"
              >
                {checking ? "در حال بررسی موجودی…" : "ابتدا کالاهای ناموجود را حذف کنید"}
              </span>
            ) : (
              <Link href="/checkout" className="rounded-sm bg-ink py-4 text-center text-[15px] text-paper transition-colors hover:bg-ink/90">
                ادامه و ثبت سفارش
              </Link>
            )}
            <span className="text-center text-xs text-muted-foreground">پرداخت امن از طریق درگاه بانکی</span>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-body">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function FreeShippingBar({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
  return (
    <div className="mb-3 flex flex-col gap-2.5 rounded-md bg-sand px-[18px] py-3.5 text-[13px]">
      <span>
        {remaining === 0
          ? "ارسال سفارش شما رایگان است."
          : `${formatPrice(remaining)} تومان دیگر خرید کنید تا ارسال رایگان شود.`}
      </span>
      <div className="h-1 overflow-hidden rounded-sm bg-[#ddd3c5]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
