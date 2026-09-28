import { prisma } from "@/lib/db";

export type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  itemCount: number;
  itemNames: string[];
};

/**
 * A customer's own order history, newest first. `userId` must come from a
 * verified session. Unpaid orders that were cancelled (abandoned checkouts)
 * are left out — they'd only be noise.
 */
export async function getOrdersForCustomer(userId: string, take?: number): Promise<CustomerOrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: { userId, NOT: { status: "CANCELLED", paidAt: null } },
    include: { items: { select: { name: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt,
    itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    itemNames: o.items.map((i) => i.name),
  }));
}

export async function getOrderCounts(userId: string) {
  const [active, delivered] = await Promise.all([
    prisma.order.count({ where: { userId, status: { in: ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED"] } } }),
    prisma.order.count({ where: { userId, status: "DELIVERED" } }),
  ]);
  return { active, delivered };
}

export type CustomerOrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  paymentRefId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  address: {
    fullName: string;
    phone: string;
    province: string;
    city: string;
    addressLine: string;
    postalCode: string;
  } | null;
  discountCode: string | null;
  items: {
    id: string;
    name: string;
    size: string | null;
    color: string | null;
    price: number;
    quantity: number;
    productSlug: string | null;
    image: string | null;
  }[];
};

/**
 * Security-critical: `id` and `userId` are in the *same* where clause, so
 * the query itself returns null for an order that belongs to someone else.
 * Never split this into "fetch by id, then check the owner".
 */
export async function getOrderForCustomer(orderId: string, userId: string): Promise<CustomerOrderDetail | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      address: true,
      discountCode: { select: { code: true } },
      items: {
        include: {
          product: { select: { slug: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
          variant: { include: { color: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } } } },
        },
      },
    },
  });
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    shippingCost: order.shippingCost,
    total: order.total,
    paymentRefId: order.paymentRefId,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    address: order.address
      ? {
          fullName: order.address.fullName,
          phone: order.address.phone,
          province: order.address.province,
          city: order.address.city,
          addressLine: order.address.addressLine,
          postalCode: order.address.postalCode,
        }
      : null,
    discountCode: order.discountCode?.code ?? null,
    items: order.items.map((i) => ({
      id: i.id,
      name: i.name,
      size: i.size,
      color: i.color,
      price: i.price,
      quantity: i.quantity,
      productSlug: i.product?.slug ?? null,
      image: i.variant?.color?.images[0]?.url ?? i.product?.images[0]?.url ?? null,
    })),
  };
}
