import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shared/product-card";
import { ProductDetail } from "@/components/shop/product-detail";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products";
import { siteConfig, siteUrl } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const description =
    product.metaDescription ?? product.description.slice(0, 160);
  const image = product.images[0]?.url;
  return {
    title: product.metaTitle ?? product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.category.id);

  // Structured data for Google — price, availability and rating in search results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: product.category.title,
    ...(product.images.length > 0
      ? { image: product.images.map((i) => i.url) }
      : {}),
    brand: { "@type": "Brand", name: siteConfig.site.name },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "IRR",
      // Prices are stored in Toman; schema.org's IRR is Rial.
      price: product.price * 10,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(product.rating != null && (product.reviewCount ?? 0) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.rating.toFixed(1)),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <nav
        aria-label="مسیر"
        className="wrap flex flex-wrap gap-2 pt-5 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-ink">
          خانه
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/products/category/${product.category.slug}`}
          className="hover:text-ink"
        >
          {product.category.title}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      {/* key: switching between products must reset the selected color/size */}
      <ProductDetail key={product.id} product={product} />

      {related.length > 0 && (
        <section className="wrap pt-[clamp(56px,8vw,96px)]">
          <h2 className="mb-7 text-[clamp(24px,3vw,32px)] font-normal">
            {siteConfig.product.related}
          </h2>
          <div className="grid gap-[clamp(12px,2vw,30px)] [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(210px,1fr))] lg:[grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
