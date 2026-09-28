export type ShippingRule = {
  /** Orders at or above this subtotal ship free. null = never free. */
  freeShippingThreshold: number | null;
  /** The single flat shipping cost (Toman). */
  standardShippingCost: number;
};

/** One flat shipping cost, waived above the free-shipping threshold. Used by checkout *and* the cart preview. */
export function calcShipping(subtotal: number, rule: ShippingRule): number {
  if (rule.freeShippingThreshold != null && subtotal >= rule.freeShippingThreshold) return 0;
  return rule.standardShippingCost;
}
