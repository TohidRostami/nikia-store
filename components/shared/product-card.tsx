import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import { WishlistButton } from "@/components/shared/wishlist-button";
import {
  discountPercent,
  formatPrice,
  formatRating,
  toPersianDigits,
} from "@/lib/format";
import type { ProductDTO } from "@/lib/types";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductDTO;
  priority?: boolean;
}) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const firstColor = product.colors[0];
  const image =
    product.images.find((i) => i.colorId === firstColor?.id) ??
    product.images[0];
  const badge = !product.inStock
    ? "ناموجود"
    : off > 0
      ? `${toPersianDigits(off)}٪ تخفیف`
      : product.isNew
        ? "جدید"
        : null;
  const badgeClass = off > 0 && product.inStock ? "bg-sale" : "bg-ink";
  const href = `/products/${product.slug}`;

  return (
    <div className="flex min-w-0 flex-col gap-3 border-1 rounded-xl p-2 shadow-lg transition-transform duration-500 hover:scale-[1.03]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sand">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0"
        >
          {image ? (
            <div className="relative h-full w-full overflow-hidden">
              <Image
                src={image.url}
                alt={image.alt ?? product.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                priority={priority}
                className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              />

              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_25px_rgba(0,0,0,0.80)]" />
            </div>
          ) : (
            <ProductPlaceholder
              categorySlug={product.category.slug}
              tint={firstColor?.hexValue}
            />
          )}
        </Link>
        {badge && (
          <span
            className={`pointer-events-none absolute left-1 top-1 rounded-full px-2.5 py-1 text-[11px] text-paper ${badgeClass}`}
          >
            {badge}
          </span>
        )}
      </div>

      <Link href={href} className="flex flex-col gap-1.5">
        <span className="flex flex-col items-start gap-2">
          <span className="line-clamp-2 text-[13px] text-paragraph">
            {product.category.title}
          </span>
          <span className="line-clamp-2 text-sm font-medium">
            {product.name}
          </span>
          <span
            className="flex shrink-0 gap-1"
            aria-label={`${toPersianDigits(product.colors.length)} رنگ`}
          >
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.id}
                title={c.name}
                className="size-2.5 rounded-full border border-line"
                style={{ background: c.hexValue ?? "#d4d4d4" }}
              />
            ))}
          </span>
        </span>
        <span className="flex flex-wrap items-baseline justify-end gap-1">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-[#9a8f82] line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
          <span className="text-sm font-semibold">
            {formatPrice(product.price)} تومان
          </span>
        </span>
      </Link>
    </div>
  );
}
