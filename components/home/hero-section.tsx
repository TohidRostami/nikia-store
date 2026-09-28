import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HeroSlider } from "@/components/home/hero-slider";
import type { ServiceBadge } from "@/components/home/service-badges";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import type { SiteConfig } from "@/lib/content";

export function HeroSection({
  hero,
  images,
}: {
  hero: SiteConfig["home"]["hero"];
  images: { id: string; url: string }[];
}) {
  return (
    <section className="bg-sand mx-2 rounded-2xl">
      <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-stretch">
        {/* Text / Hero Content */}
        <div className="hero-rise relative flex h-[650px] flex-[1_1_420px] flex-col justify-center gap-6 overflow-hidden px-4 pb-[clamp(96px,10vw,140px)] pt-[clamp(40px,7vw,96px)] sm:h-auto sm:px-6 lg:px-10">
          {/* Mobile Background Image */}
          {images.length > 0 && (
            <div
              className="absolute inset-0 bg-cover bg-center lg:hidden rounded-xl"
              style={{ backgroundImage: `url(${images[0].url})` }}
            />
          )}

          {/* Mobile Overlay */}
          <div className="absolute inset-0 bg-sand/80 lg:hidden" />

          {/* Content */}
          <div className="relative z-10">
            <h1 className="text-[clamp(38px,5.6vw,72px)] font-light leading-[1.35] tracking-[-0.5px] [text-wrap:balance]">
              {hero.headlineLight}
              <br />
              <span className="font-semibold">{hero.headlineBold}</span>
            </h1>

            <p className="max-w-[420px] text-[15px] leading-[2.1] text-body [text-wrap:pretty]">
              {hero.subheadline}
            </p>

            <div className="flex flex-wrap items-center gap-5 mt-4">
              {/* buttons */}
              <Link
                href={hero.ctaPrimary.href}
                className="flex items-center gap-3 rounded-sm bg-ink px-7 py-[15px] text-sm text-paper transition-colors hover:bg-ink/90"
              >
                {hero.ctaPrimary.label}
                <ArrowLeft className="size-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Image */}
        <div className="relative hidden min-h-[clamp(420px,52vw,580px)] flex-[1_1_420px] overflow-hidden lg:block">
          {images.length > 0 ? (
            <HeroSlider images={images} alt={hero.imageAlt} />
          ) : (
            <ProductPlaceholder
              categorySlug="manto"
              tint="#D9CBB5"
              className="[&_svg]:h-2/5 [&_svg]:w-2/5"
            />
          )}
        </div>
      </div>
    </section>
  );
}

