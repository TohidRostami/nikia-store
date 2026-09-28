import { CategoryGrid } from "@/components/home/category-grid";
import { CategoryStrip } from "@/components/home/category-strip";
import { FeaturedProducts } from "@/components/home/featured-products";
import { HeroSection } from "@/components/home/hero-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { PromoBanners } from "@/components/home/promo-banners";
import { ServiceBar } from "@/components/home/service-bar";
import { resolveBadges } from "@/components/home/service-badges";
import { siteConfig } from "@/lib/content";
import { formatToman } from "@/lib/format";
import { getHeroImages } from "@/lib/queries/hero-images";
import { getCategoriesCached, getHomeData } from "@/lib/queries/products";
import { getSiteSettingsCached } from "@/lib/queries/settings";

export default async function HomePage() {
  const [home, categories, heroImages, settings] = await Promise.all([
    getHomeData(),
    getCategoriesCached(),
    getHeroImages({ activeOnly: true }),
    getSiteSettingsCached(),
  ]);

  const content = siteConfig.home;
  const badgeOptions = {
    showFreeShipping: settings.freeShippingThreshold != null,
    values: {
      threshold: settings.freeShippingThreshold
        ? formatToman(settings.freeShippingThreshold)
        : "",
      supportHours: siteConfig.contact.supportHours,
    },
  };

  return (
    <>
      <HeroSection hero={content.hero} images={heroImages} />
      <CategoryStrip categories={categories} />
      <FeaturedProducts
        eyebrow={content.featuredEyebrow}
        title={content.featuredTitle}
        products={home.featured.length > 0 ? home.featured : home.newArrivals}
      />

      <PromoBanners
        promos={content.promos}
        saleProduct={home.saleProduct}
        newArrivals={home.newArrivals}
      />
      <ServiceBar badges={resolveBadges(content.serviceBar, badgeOptions)} />
      <NewsletterSection content={content.newsletter} />
    </>
  );
}
