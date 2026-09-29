import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import type { SiteConfig } from "@/lib/content";
import type { ProductDTO } from "@/lib/types";

/**
 * The two promo cards. Each borrows a real product's photo — the actual
 * sale item for the discount card, a new arrival for the other — so they
 * stay current without anyone uploading banner images.
 */
export function PromoBanners({
  promos,
  saleProduct,
  newArrivals,
}: {
  promos: SiteConfig["home"]["promos"];
  saleProduct: ProductDTO | null;
  newArrivals: ProductDTO[];
}) {
  const newProduct = newArrivals.find((p) => p.images[0]);

  return (
    <section className="wrap grid gap-4 pt-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
      {promos.map((promo, i) => {
        const source = i === 0 ? saleProduct : newProduct;
        const img = source?.images[0];
        return (
          <div
            key={promo.eyebrow}
            className={`flex min-h-[260px] overflow-hidden rounded-lg shadow-lg ${i === 0 ? "bg-sand-2" : "bg-sand-3"}`}
          >
            <div className="flex flex-[1.2] flex-col justify-center gap-3 p-[clamp(24px,3vw,40px)]">
              <span className="text-[11px] text-muted-foreground">
                {promo.eyebrow}
              </span>
              <h3 className="text-[clamp(22px,2.4vw,30px)] font-normal leading-[1.6]">
                {promo.titleLight}
                <br />
                <b className="font-semibold">{promo.titleBold}</b>
              </h3>
              <Link
                href={promo.cta.href}
                className="mt-2 flex items-center gap-2 self-start rounded-sm bg-ink px-5 py-3 text-[13px] text-paper transition-colors hover:bg-ink/90"
              >
                {promo.cta.label}
                <ArrowLeft className="size-3.5" strokeWidth={1.5} />
              </Link>
            </div>
            <div className="relative flex-1">
              {img ? (
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <ProductPlaceholder
                  categorySlug={
                    source?.category.slug ?? (i === 0 ? "skirt" : "dress")
                  }
                  tint={source?.colors[0]?.hexValue}
                  className="bg-ink/5"
                />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
