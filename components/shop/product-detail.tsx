"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import { WishlistButton } from "@/components/shared/wishlist-button";
import { SizeGuideTable } from "@/components/shop/size-guide-table";
import { siteConfig } from "@/lib/content";
import { discountPercent, formatPrice, formatRating, toPersianDigits } from "@/lib/format";
import { MAX_LINE_QUANTITY } from "@/lib/product-constants";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";
import type { ProductDetailDTO } from "@/lib/types";

export function ProductDetail({ product }: { product: ProductDetailDTO }) {
  const hasColors = product.colors.length > 0;

  const [colorId, setColorId] = useState<string | null>(() => {
    const inStock = product.colors.find((c) => product.variants.some((v) => v.colorId === c.id && v.stock > 0));
    return (inStock ?? product.colors[0])?.id ?? null;
  });

  const variantsForColor = useMemo(
    () => (hasColors ? product.variants.filter((v) => v.colorId === colorId) : product.variants),
    [hasColors, product.variants, colorId],
  );
  const hasVariants = variantsForColor.length > 0;

  const [variantId, setVariantId] = useState<string | null>(
    () => variantsForColor.find((v) => v.stock > 0)?.id ?? null,
  );
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const selectedVariant = product.variants.find((v) => v.id === variantId) ?? null;
  const selectedColor = product.colors.find((c) => c.id === colorId) ?? null;
  const cartKey = selectedVariant?.id ?? product.id;
  const inCart = cartItems.find((i) => i.variantId === cartKey)?.quantity ?? 0;

  // A product with no variants has no stock counter — checkout treats it as unlimited.
  const stock = hasVariants ? (selectedVariant?.stock ?? 0) : MAX_LINE_QUANTITY;
  const limit = Math.min(MAX_LINE_QUANTITY, stock);
  const soldOut = hasVariants ? !variantsForColor.some((v) => v.stock > 0) : !product.inStock;

  const colorImages = hasColors ? product.images.filter((i) => i.colorId === colorId) : product.images;
  const gallery = colorImages.length > 0 ? colorImages : product.images;
  const activeImage = gallery[Math.min(imageIndex, gallery.length - 1)];

  const off = discountPercent(product.price, product.compareAtPrice);

  function pickColor(id: string) {
    setColorId(id);
    setImageIndex(0);
    setAdded(false);
    const next = product.variants.filter((v) => v.colorId === id);
    setVariantId(next.find((v) => v.stock > 0)?.id ?? null);
    setQty(1);
  }

  function handleAdd() {
    if (hasVariants && (!selectedVariant || selectedVariant.stock === 0)) {
      toast.error("لطفاً سایز را انتخاب کنید.");
      return;
    }
    const room = limit - inCart;
    if (room <= 0) {
      toast.error(`حداکثر ${toPersianDigits(limit)} عدد از این کالا قابل سفارش است.`);
      return;
    }
    const quantity = Math.min(qty, room);
    addItem(
      {
        productId: product.id,
        variantId: cartKey,
        slug: product.slug,
        name: product.name,
        price: product.price,
        size: selectedVariant?.size?.name ?? null,
        color: selectedVariant?.color?.name ?? selectedColor?.name ?? null,
        categorySlug: product.category.slug,
        image: gallery[0]?.url ?? null,
      },
      quantity,
    );
    setAdded(true);
    toast.success("به سبد خرید اضافه شد", { description: product.name });
    if (quantity < qty) toast(`به‌دلیل محدودیت موجودی، ${toPersianDigits(quantity)} عدد اضافه شد.`);
  }

  const sizeGuide = useMemo(() => {
    const seen = new Map<string, { name: string; description: string | null }>();
    for (const v of product.variants) if (v.size && !seen.has(v.size.id)) seen.set(v.size.id, v.size);
    return [...seen.values()];
  }, [product.variants]);

  const accordion = [
    { key: "desc", title: "توضیحات محصول", body: product.description },
    ...(product.materialCare ? [{ key: "care", title: "جنس و نگهداری", body: product.materialCare }] : []),
    { key: "ship", title: "ارسال و بازگشت", body: siteConfig.product.shippingAccordion },
  ];

  return (
    <section className="wrap grid items-start gap-[clamp(28px,5vw,64px)] pt-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
      {/* Gallery */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sand">
          {activeImage ? (
            <Image
              key={activeImage.id}
              src={activeImage.url}
              alt={activeImage.alt ?? product.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <ProductPlaceholder categorySlug={product.category.slug} tint={selectedColor?.hexValue} />
          )}
        </div>
        {gallery.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {gallery.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setImageIndex(i)}
                aria-label={`تصویر ${toPersianDigits(i + 1)}`}
                aria-current={i === imageIndex}
                className={cn(
                  "relative aspect-[4/5] overflow-hidden rounded-md bg-sand outline-offset-2 transition-opacity",
                  i === imageIndex ? "ring-[1.5px] ring-ink" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="12vw" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <span className="text-xs text-muted-foreground">{product.category.title}</span>
          <h1 className="text-[clamp(26px,3vw,36px)] font-medium leading-[1.5]">{product.name}</h1>
          {product.rating != null && (product.reviewCount ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 text-[13px] text-body">
              <Star className="size-3.5 fill-current" strokeWidth={0} />
              {formatRating(product.rating)} · {toPersianDigits(product.reviewCount ?? 0)} نظر
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-2xl font-semibold">{formatPrice(product.price)} تومان</span>
          {off > 0 && product.compareAtPrice && (
            <>
              <span className="text-[15px] text-[#9a8f82] line-through">{formatPrice(product.compareAtPrice)}</span>
              <span className="rounded-full bg-sale px-2.5 py-[3px] text-xs text-white">{toPersianDigits(off)}٪ تخفیف</span>
            </>
          )}
        </div>

        {hasColors && (
          <div className="flex flex-col gap-3">
            <span className="text-[13px]">
              رنگ: <b className="font-semibold">{selectedColor?.name}</b>
            </span>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickColor(c.id)}
                  aria-label={c.name}
                  aria-pressed={c.id === colorId}
                  title={c.name}
                  className="size-[34px] rounded-full border border-line outline outline-[1.5px] outline-offset-[3px]"
                  style={{ background: c.hexValue ?? "#d4d4d4", outlineColor: c.id === colorId ? "var(--brand-ink)" : "transparent" }}
                />
              ))}
            </div>
          </div>
        )}

        {hasVariants && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-[13px]">
              <span>
                سایز: <b className="font-semibold">{selectedVariant?.size ? toPersianDigits(selectedVariant.size.name) : "انتخاب کنید"}</b>
              </span>
              {sizeGuide.length > 0 && (
                <button type="button" onClick={() => setGuideOpen((o) => !o)} aria-expanded={guideOpen} className="text-[13px] text-body underline">
                  راهنمای سایز
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {variantsForColor.map((v) => {
                const out = v.stock === 0;
                const on = v.id === variantId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={out}
                    aria-pressed={on}
                    onClick={() => {
                      setVariantId(v.id);
                      setQty(1);
                    }}
                    className={cn(
                      "h-12 min-w-14 rounded-sm border px-2 text-sm transition-colors",
                      out && "cursor-not-allowed border-line text-[#b3a898] line-through",
                      !out && on && "border-ink bg-ink text-paper",
                      !out && !on && "border-line bg-white hover:border-ink",
                    )}
                  >
                    {v.size ? toPersianDigits(v.size.name) : "—"}
                  </button>
                );
              })}
            </div>
            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3 && (
              <p className="text-xs text-sale">تنها {toPersianDigits(selectedVariant.stock)} عدد باقی مانده</p>
            )}
            {guideOpen && <SizeGuideTable sizes={sizeGuide} />}
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          <div className="flex h-[52px] items-center rounded-sm border border-line bg-white">
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(limit, q + 1))}
              disabled={soldOut || qty >= limit}
              aria-label="افزایش تعداد"
              className="flex h-full w-11 items-center justify-center disabled:opacity-30"
            >
              <Plus className="size-4" strokeWidth={1.5} />
            </button>
            <span className="min-w-7 text-center text-[15px]" aria-live="polite">
              {toPersianDigits(qty)}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="کاهش تعداد"
              className="flex h-full w-11 items-center justify-center disabled:opacity-30"
            >
              <Minus className="size-4" strokeWidth={1.5} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="h-[52px] flex-[1_1_200px] rounded-sm bg-ink text-[15px] text-paper transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted-foreground"
          >
            {soldOut ? siteConfig.ui.outOfStock : siteConfig.ui.addToCart}
          </button>
          <WishlistButton productId={product.id} size="lg" className="rounded-sm" />
        </div>
        {added && (
          <Link href="/cart" className="-mt-3 text-[13px] underline">
            مشاهده سبد خرید ←
          </Link>
        )}

        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
          {siteConfig.product.infoTiles.map((t) => (
            <div key={t.title} className="rounded-md bg-sand p-3.5 text-xs leading-[1.9]">
              <b className="text-[13px] font-semibold">{t.title}</b>
              <br />
              <span className="text-body">{t.text}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#e2dace]">
          {accordion.map((a, i) => (
            <details key={a.key} open={i === 0} className="group border-b border-[#e2dace]">
              <summary className="flex cursor-pointer list-none items-center justify-between py-[18px] text-sm [&::-webkit-details-marker]:hidden">
                {a.title}
                <span className="text-lg font-light group-open:hidden">+</span>
                <span className="hidden text-lg font-light group-open:inline">−</span>
              </summary>
              <p className="pb-[18px] text-[13px] leading-[2.1] text-body">{a.body}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
