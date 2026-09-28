"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Search, X, Plus, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  searchProducts,
  searchCustomers,
  createInPersonOrder,
  type PosOrderItemInput,
} from "@/app/admin/pos/actions";
import type {
  PosProductResult,
  PosCustomerResult,
} from "@/lib/queries/admin-pos";

type CartLine = PosOrderItemInput & { key: string };

export function PosForm() {
  // ── محصول: سرچ + انتخاب رنگ/سایز/تعداد ──────────────────────────
  const [productQuery, setProductQuery] = useState("");
  const [rawProductResults, setProductResults] = useState<PosProductResult[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<PosProductResult | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);

  // ── فاکتور در حال ساخت ────────────────────────────────────────────
  const [cart, setCart] = useState<CartLine[]>([]);

  // ── مشتری (اختیاری) ──────────────────────────────────────────────
  const [customerQuery, setCustomerQuery] = useState("");
  const [rawCustomerResults, setCustomerResults] = useState<PosCustomerResult[]>(
    [],
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<PosCustomerResult | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const productInputRef = useRef<HTMLInputElement>(null);

  // سرچ محصول با تأخیر — با نام یا کد کالا
  // Results only show while the box holds a query and nothing is picked yet.
  const productResults = productQuery.trim() && !selectedProduct ? rawProductResults : [];
  const customerResults = customerQuery.trim() && !selectedCustomer ? rawCustomerResults : [];

  useEffect(() => {
    if (!productQuery.trim() || selectedProduct) return;
    const timer = setTimeout(() => {
      searchProducts(productQuery).then(setProductResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [productQuery, selectedProduct]);

  // سرچ مشتری با تأخیر
  useEffect(() => {
    if (!customerQuery.trim() || selectedCustomer) return;
    const timer = setTimeout(() => {
      searchCustomers(customerQuery).then(setCustomerResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerQuery, selectedCustomer]);

  function pickProduct(p: PosProductResult) {
    setSelectedProduct(p);
    setProductQuery(p.name);
    setProductResults([]);
    setSelectedColorId(p.colors[0]?.id ?? null);
    const firstVariant =
      p.colors.length > 0
        ? p.variants.find((v) => v.colorId === p.colors[0]?.id)
        : p.variants[0];
    setSelectedVariantId(firstVariant?.id ?? null);
    setQuantity(1);
  }

  function clearProductSelection() {
    setSelectedProduct(null);
    setProductQuery("");
    setSelectedColorId(null);
    setSelectedVariantId(null);
    setQuantity(1);
    productInputRef.current?.focus();
  }

  const variantsForColor = selectedProduct
    ? selectedProduct.colors.length > 0
      ? selectedProduct.variants.filter((v) => v.colorId === selectedColorId)
      : selectedProduct.variants
    : [];
  const selectedVariant =
    selectedProduct?.variants.find((v) => v.id === selectedVariantId) ?? null;
  const hasVariants = (selectedProduct?.variants.length ?? 0) > 0;
  const availableStock = hasVariants ? (selectedVariant?.stock ?? 0) : Infinity;
  const canAdd =
    selectedProduct !== null &&
    (!hasVariants || selectedVariant !== null) &&
    availableStock > 0;

  function handleSelectColor(colorId: string) {
    setSelectedColorId(colorId);
    const next = selectedProduct?.variants.find((v) => v.colorId === colorId);
    setSelectedVariantId(next?.id ?? null);
    setQuantity(1);
  }

  function addToCart() {
    if (!selectedProduct || !canAdd) return;
    const colorName =
      selectedProduct.colors.find((c) => c.id === selectedColorId)?.name ??
      null;

    setCart((prev) => {
      // اگه دقیقاً همین رنگ/سایز از قبل توی لیسته، فقط تعدادش رو زیاد کن
      const existingIndex = prev.findIndex(
        (line) =>
          line.variantId === (selectedVariant?.id ?? null) &&
          line.productId === selectedProduct.id,
      );
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }
      return [
        ...prev,
        {
          key: `${selectedProduct.id}-${selectedVariant?.id ?? "novariant"}-${Date.now()}`,
          productId: selectedProduct.id,
          variantId: selectedVariant?.id ?? null,
          name: selectedProduct.name,
          size: selectedVariant?.sizeName ?? null,
          color: colorName,
          price: selectedProduct.price,
          quantity,
        },
      ];
    });
    clearProductSelection();
  }

  function updateCartPrice(key: string, price: number) {
    setCart((prev) =>
      prev.map((line) => (line.key === key ? { ...line, price } : line)),
    );
  }
  function removeCartLine(key: string) {
    setCart((prev) => prev.filter((line) => line.key !== key));
  }

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);

  function pickCustomer(c: PosCustomerResult) {
    setSelectedCustomer(c);
    setCustomerQuery(c.name);
    setCustomerResults([]);
  }
  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerQuery("");
  }

  async function handleSubmit() {
    if (cart.length === 0) {
      toast.error("حداقل یک کالا باید به فاکتور اضافه شود.");
      return;
    }
    if (!selectedCustomer && !customerQuery.trim()) {
      toast.error("نام مشتری الزامی است (نیازی به داشتن حساب کاربری نیست).");
      return;
    }
    setSubmitting(true);
    const result = await createInPersonOrder({
      items: cart.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        name: line.name,
        size: line.size,
        color: line.color,
        price: line.price,
        quantity: line.quantity,
      })),
      customerUserId: selectedCustomer?.id ?? null,
      walkInCustomerName: selectedCustomer
        ? null
        : customerQuery.trim() || null,
    });
    setSubmitting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(`فاکتور ${result.orderNumber} ثبت شد.`);
    // آماده برای فاکتور بعدی — بدون نیاز به خروج از این صفحه
    setCart([]);
    clearCustomer();
    clearProductSelection();
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      {/* ستون جستجو و انتخاب کالا */}
      <div className="flex flex-col gap-5 lg:col-span-3">
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-sm font-medium">جستجوی کالا</h2>

          <div className="relative">
            <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={productInputRef}
              value={productQuery}
              onChange={(e) => {
                setProductQuery(e.target.value);
                if (selectedProduct) setSelectedProduct(null);
              }}
              placeholder="جستجو با نام یا کد کالا..."
              className="pe-10"
            />
            {productResults.length > 0 && (
              <div className="absolute z-10 mt-1.5 w-full rounded-md border border-border bg-background shadow-lg">
                {productResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickProduct(p)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-secondary"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-muted-foreground" dir="ltr">
                      {p.sku ?? "—"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="mt-5 flex flex-col gap-5 border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{selectedProduct.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatPrice(selectedProduct.price)} تومان
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearProductSelection}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  انصراف
                </button>
              </div>

              {selectedProduct.colors.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">رنگ</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colors.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectColor(c.id)}
                        title={c.name}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-full border-2 transition-colors",
                          c.id === selectedColorId
                            ? "border-foreground"
                            : "border-transparent hover:border-border",
                        )}
                      >
                        <span
                          className="size-6 rounded-full border border-border/50"
                          style={{ backgroundColor: c.hexValue ?? "#d4d4d4" }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasVariants && (
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">سایز</p>
                  <div className="flex flex-wrap gap-2">
                    {variantsForColor.map((v) => {
                      const isOut = v.stock === 0;
                      const isSelected = v.id === selectedVariantId;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={isOut}
                          onClick={() => {
                            setSelectedVariantId(v.id);
                            setQuantity(1);
                          }}
                          className={cn(
                            "font-nums flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm transition-colors",
                            isOut &&
                              "cursor-not-allowed border-border text-muted-foreground/40 line-through",
                            !isOut &&
                              isSelected &&
                              "border-foreground bg-foreground text-background",
                            !isOut &&
                              !isSelected &&
                              "border-border hover:border-foreground/40",
                          )}
                        >
                          {v.sizeName ?? "—"}
                        </button>
                      );
                    })}
                  </div>
                  {selectedVariant && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      موجودی:{" "}
                      <span className="font-nums">
                        {toPersianDigits(selectedVariant.stock)}
                      </span>{" "}
                      عدد
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground">تعداد</p>
                  <div className="flex items-center rounded-md border border-border">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex size-9 items-center justify-center text-foreground/70 hover:text-foreground"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="font-nums w-10 text-center text-sm">
                      {toPersianDigits(quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) => Math.min(availableStock, q + 1))
                      }
                      disabled={quantity >= availableStock}
                      className="flex size-9 items-center justify-center text-foreground/70 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
                <Button type="button" onClick={addToCart} disabled={!canAdd}>
                  <Plus className="size-4" />
                  افزودن به فاکتور
                </Button>
              </div>
              {hasVariants && !selectedVariant && (
                <p className="text-xs text-destructive">یک سایز انتخاب کنید.</p>
              )}
              {hasVariants && selectedVariant?.stock === 0 && (
                <p className="text-xs text-destructive">
                  این ترکیب رنگ/سایز موجودی ندارد.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ستون فاکتور در حال ساخت */}
      <div className="flex flex-col gap-5 lg:col-span-2">
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-sm font-medium">مشتری</h2>
          {selectedCustomer ? (
            <div className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{selectedCustomer.name}</p>
                {selectedCustomer.phoneNumber && (
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {selectedCustomer.phoneNumber}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={clearCustomer}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                حذف
              </button>
            </div>
          ) : (
            <div className="relative">
              <Input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="نام مشتری..."
              />
              {customerResults.length > 0 && (
                <div className="absolute z-10 mt-1.5 w-full rounded-md border border-border bg-background shadow-lg">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pickCustomer(c)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-secondary"
                    >
                      <span>{c.name}</span>
                      {c.phoneNumber && (
                        <span
                          className="text-xs text-muted-foreground"
                          dir="ltr"
                        >
                          {c.phoneNumber}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-1.5 text-xs text-muted-foreground">
                اگه حساب کاربری داشت از لیست انتخابش کن؛ وگرنه همین اسم فقط برای
                این فاکتور ثبت می‌شه.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-sm font-medium">اقلام فاکتور</h2>

          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              هنوز کالایی اضافه نشده.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {cart.map((line) => (
                <li
                  key={line.key}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {line.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {line.color ?? "—"} / {line.size ?? "—"} · تعداد:{" "}
                        <span className="font-nums">
                          {toPersianDigits(line.quantity)}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCartLine(line.key)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="حذف"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <div className="flex items-center rounded-md border border-border">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(line.key, line.quantity - 1)
                        }
                        className="flex size-8 items-center justify-center text-foreground/70 hover:text-foreground"
                        aria-label="کم کردن تعداد"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="font-nums w-8 text-center text-sm">
                        {toPersianDigits(line.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(line.key, line.quantity + 1)
                        }
                        className="flex size-8 items-center justify-center text-foreground/70 hover:text-foreground"
                        aria-label="زیاد کردن تعداد"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div> */}
                    <Input
                      dir="ltr"
                      thousandSeparator
                      min={0}
                      value={line.price}
                      onChange={(e) =>
                        updateCartPrice(line.key, Number(e.target.value))
                      }
                      className="h-8 flex-1 text-sm"
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">
                      تومان
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-base font-medium">
            <span>مجموع</span>
            <span>{formatPrice(total)} تومان</span>
          </div>

          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={
              cart.length === 0 ||
              (!selectedCustomer && !customerQuery.trim()) ||
              submitting
            }
            onClick={handleSubmit}
          >
            {submitting ? "در حال ثبت..." : "ثبت فاکتور"}
          </Button>
        </div>
      </div>
    </div>
  );
}
