export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل داده‌شده",
  CANCELLED: "لغوشده",
  REFUNDED: "بازگشت‌داده‌شده",
};

export const ORDER_STATUS_TONE: Record<string, string> = {
  PENDING_PAYMENT: "bg-secondary text-foreground",
  PAID: "bg-accent-2 text-accent-2-foreground",
  PROCESSING: "bg-accent-2 text-accent-2-foreground",
  SHIPPED: "bg-accent text-accent-foreground",
  DELIVERED: "bg-success text-success-foreground",
  CANCELLED: "bg-destructive text-destructive-foreground",
  REFUNDED: "bg-secondary text-muted-foreground",
};

/** Pill colors for the customer-facing account pages (the admin uses ORDER_STATUS_TONE above). */
export const ORDER_STATUS_PILL: Record<string, string> = {
  PENDING_PAYMENT: "bg-sand-3 text-ink",
  PAID: "bg-success-bg text-success",
  PROCESSING: "bg-success-bg text-success",
  SHIPPED: "bg-ink text-paper",
  DELIVERED: "bg-success-bg text-success",
  CANCELLED: "bg-[#f3e1dd] text-sale",
  REFUNDED: "bg-sand-3 text-body",
};
