import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

export type SiteSettings = {
  emailLoginEnabled: boolean;
  smsLoginEnabled: boolean;
  freeShippingThreshold: number | null;
  standardShippingCost: number;
};

const DEFAULTS: SiteSettings = {
  emailLoginEnabled: true,
  smsLoginEnabled: true,
  freeShippingThreshold: null,
  standardShippingCost: 0,
};

/** Always reads the database — use this for anything money-related (checkout). */
export async function getSiteSettings(): Promise<SiteSettings> {
  const s = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  if (!s) return DEFAULTS;
  return {
    emailLoginEnabled: s.emailLoginEnabled,
    smsLoginEnabled: s.smsLoginEnabled,
    freeShippingThreshold: s.freeShippingThreshold,
    standardShippingCost: s.standardShippingCost,
  };
}

/**
 * Same data, cached for 60 seconds — for display only (header banner,
 * cart estimate). Changes made in the admin panel show up within a minute.
 */
export const getSiteSettingsCached = unstable_cache(getSiteSettings, ["site-settings"], {
  revalidate: 60,
});
