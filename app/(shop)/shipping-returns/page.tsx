import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/legal-page";
import { siteConfig } from "@/lib/content";

const page = siteConfig.legal.shippingReturns;
export const metadata: Metadata = { title: page.title, alternates: { canonical: "/shipping-returns" } };

export default function ShippingReturnsPage() {
  return <LegalPage title={page.title} sections={page.sections} />;
}
