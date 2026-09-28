import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/estedad/wght.css";
import "@fontsource-variable/vazirmatn/wght.css";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig, siteUrl } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.seo.defaultTitle,
    template: siteConfig.seo.titleTemplate,
  },
  description: siteConfig.seo.defaultDescription,
  keywords: siteConfig.site.keywords,
  openGraph: {
    type: "website",
    locale: siteConfig.site.locale,
    siteName: siteConfig.site.name,
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: siteConfig.theme.colors.background,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster
          position="top-center"
          dir="rtl"
          toastOptions={{ classNames: { toast: "font-sans" } }}
        />
      </body>
    </html>
  );
}
