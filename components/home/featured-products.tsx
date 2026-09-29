import { ProductCard } from "@/components/shared/product-card";
import { SectionHeading } from "@/components/shared/section-heading";
import type { ProductDTO } from "@/lib/types";

export function FeaturedProducts({
  eyebrow,
  title,
  products,
}: {
  eyebrow: string;
  title: string;
  products: ProductDTO[];
}) {
  if (products.length === 0) return null;
  console.log(products);
  return (
    <section className="wrap pt-[clamp(56px,7vw,88px)]">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        href="/products"
        linkLabel="همه محصولات"
      />
      <div
        className="grid gap-[clamp(12px,2vw,30px)] [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(210px,1fr))] lg:[grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]"
      >
        {products.slice(0,4).map((p, i) => (
          // The first row is above the fold on most screens — load its images eagerly.
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
    </section>
  );
}
