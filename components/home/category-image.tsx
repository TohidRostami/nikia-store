import Image from "next/image";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import type { CategoryDTO } from "@/lib/types";

/** A category's photo, or a garment line-drawing until one is uploaded. Fills its (relative) parent. */
export function CategoryImage({ category, sizes, zoom }: { category: CategoryDTO; sizes: string; zoom?: boolean }) {
  if (category.image) {
    return (
      <Image
        src={category.image}
        alt={category.title}
        fill
        sizes={sizes}
        className={zoom ? "object-cover transition-transform duration-500 group-hover:scale-[1.04]" : "object-cover"}
      />
    );
  }
  return <ProductPlaceholder categorySlug={category.slug} />;
}
