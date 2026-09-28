import siteConfigJson from "@/content/site-config.json";

export type NavLink = { label: string; href: string };
export type FooterColumn = { title: string; links: NavLink[] };
export type TextSection = { id: string; title: string; paragraphs: string[] };

export type SiteConfig = typeof siteConfigJson;

export const siteConfig: SiteConfig = siteConfigJson;

/** The canonical public URL — the env var wins so staging/preview
 * deployments generate correct absolute links, sitemap and OG data. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || siteConfig.site.url
).replace(/\/$/, "");

/** Fills `{key}` placeholders in config strings, e.g. "{threshold}". */
export function fillTemplate(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}
