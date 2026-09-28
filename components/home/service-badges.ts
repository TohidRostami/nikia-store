import { fillTemplate } from "@/lib/content";

export type ServiceBadge = { icon: string; title: string; description: string };

/**
 * Prepares the badge lists from site-config.json for display: `{placeholders}`
 * are filled in, and the free-shipping badge is dropped when no free-shipping
 * threshold is configured (it would be a promise the shop doesn't keep).
 */
export function resolveBadges(
  badges: readonly ServiceBadge[],
  options: { showFreeShipping: boolean; values: Record<string, string> },
): ServiceBadge[] {
  return badges
    .filter((b) => b.icon !== "truck" || options.showFreeShipping)
    .map((b) => ({ ...b, description: fillTemplate(b.description, options.values) }));
}
