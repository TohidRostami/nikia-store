import { SiteHeaderClient } from "@/components/layout/site-header-client";
import { getCategoriesCached } from "@/lib/queries/products";
import { getSiteSettingsCached } from "@/lib/queries/settings";
import { fillTemplate, siteConfig } from "@/lib/content";
import { formatToman } from "@/lib/format";

export async function SiteHeader() {
  const [settings, categories] = await Promise.all([
    getSiteSettingsCached().catch((error) => {
      console.error("[SiteHeader] could not load settings:", error);
      return null;
    }),
    getCategoriesCached()
      .then((list) => list.map((c) => ({ slug: c.slug, title: c.title })))
      .catch((error) => {
        console.error("[SiteHeader] could not load categories:", error);
        return [];
      }),
  ]);

  const { announcement } = siteConfig.site;
  const text = settings?.freeShippingThreshold
    ? fillTemplate(announcement.withFreeShipping, {
        threshold: formatToman(settings.freeShippingThreshold),
      })
    : announcement.default;

  return (
    <SiteHeaderClient
      announcement={text}
      links={siteConfig.nav.main}
      categories={categories}
    />
  );
}
