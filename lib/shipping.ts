/**
 * The flat shipping cost and free-shipping threshold from the admin settings.
 *
 * They no longer decide what a customer pays: both carriers are پس‌کرایه (see
 * lib/shipping-methods.ts), so nothing for shipping is charged online. Only
 * the free-shipping *promotion* (cart bar, home badges) still reads the
 * threshold — clear it in the admin settings to switch that promotion off.
 */
export type ShippingRule = {
  /** Orders at or above this subtotal ship free. null = never free. */
  freeShippingThreshold: number | null;
  /** The single flat shipping cost (Toman). */
  standardShippingCost: number;
};
