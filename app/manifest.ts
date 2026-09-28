import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.seo.defaultTitle,
    short_name: siteConfig.site.name,
    description: siteConfig.seo.defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: siteConfig.theme.colors.background,
    theme_color: siteConfig.theme.colors.background,
    lang: "fa-IR",
    dir: "rtl",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
