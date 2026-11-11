/**
 * How an order is sent. Both methods are "پس‌کرایه" (shipping collect): the
 * customer pays the carrier when the parcel is handed over, so nothing for
 * shipping is charged online — the amount paid at checkout is the goods only.
 *
 * The id is what gets saved on the order (Order.shippingMethod), so keep the
 * ids as they are; titles and descriptions can be edited freely.
 */
export const SHIPPING_METHODS = [
  {
    id: "POST",
    title: "پست",
    description: "ارسال با شرکت ملی پست جمهوری اسلامی ایران",
  },
  {
    id: "TIPAX",
    title: "تیپاکس",
    description: "ارسال با شرکت تیپاکس",
  },
] as const;

export type ShippingMethodId = (typeof SHIPPING_METHODS)[number]["id"];

export const SHIPPING_METHOD_IDS = SHIPPING_METHODS.map((m) => m.id) as [ShippingMethodId, ...ShippingMethodId[]];

/** Shown wherever the shipping line of an amount would be. */
export const SHIPPING_COLLECT_LABEL = "پس‌کرایه";

/** The explanation shown next to the choice. */
export const SHIPPING_COLLECT_NOTE =
  "هزینه‌ی ارسال به‌صورت پس‌کرایه است: آن را هنگام تحویل مرسوله به پیک یا اداره‌ی پست پرداخت می‌کنید. در لحظه‌ی خرید فقط مبلغ کالاها به‌صورت آنلاین پرداخت می‌شود.";

/** "پست (پس‌کرایه)" — null for an order made before the method was recorded (or an in-person sale). */
export function shippingMethodLabel(id: string | null | undefined): string | null {
  const method = SHIPPING_METHODS.find((m) => m.id === id);
  return method ? `${method.title} (${SHIPPING_COLLECT_LABEL})` : null;
}

export function shippingMethodTitle(id: string | null | undefined): string | null {
  return SHIPPING_METHODS.find((m) => m.id === id)?.title ?? null;
}
