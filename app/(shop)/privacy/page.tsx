import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/legal-page";
import { siteConfig } from "@/lib/content";

const page = siteConfig.legal.privacy;
export const metadata: Metadata = { title: page.title, alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return <LegalPage title={page.title} sections={page.sections} />;
}
