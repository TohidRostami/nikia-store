import { prisma } from "@/lib/db";

type UserRow = { id: string; name: string; email: string };

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  source: "ONLINE" | "IN_PERSON";
  total: number;
  subtotal: number;
  shippingCost: number;
  userId: string | null;
  addressId: string | null;
  walkInCustomerName: string | null;
  createdAt: string | Date;
  customer: UserRow | null;
};

export type AdminOrdersFilters = {
  search?: string;
  /** ISO date string "YYYY-MM-DD" (Gregorian) — matches what
   * JalaliDatePicker produces. Matches the whole calendar day. */
  date?: string;
  page?: number;
  perPage?: number;
};

export type AdminOrdersResult = {
  orders: AdminOrderRow[];
  totalCount: number;
  totalPages: number;
  page: number;
  perPage: number;
};

export const ADMIN_ORDERS_PER_PAGE = 10;

export async function getAllOrdersForAdmin(
  filters: AdminOrdersFilters = {},
): Promise<AdminOrdersResult> {
  const { search, date } = filters;
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const perPage =
    filters.perPage && filters.perPage > 0
      ? filters.perPage
      : ADMIN_ORDERS_PER_PAGE;

  let dateRange: { gte: Date; lt: Date } | undefined;
  if (date) {
    const startOfDay = new Date(`${date}T00:00:00`);
    dateRange = {
      gte: startOfDay,
      lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  // Built once and reused for both findMany and count, so the total
  // (and therefore totalPages) always matches exactly what's paginated.
  // No `mode: "insensitive"` — that's Postgres-only and breaks on this
  // project's SQLite/Turso database.
  // Search also matches walkInCustomerName, since an in-person order
  // has no linked `user` to search by name through.
  const where = {
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search } },
            { user: { name: { contains: search } } },
            { walkInCustomerName: { contains: search } },
          ],
        }
      : {}),
    ...(dateRange ? { createdAt: dateRange } : {}),
  };

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: (
      orders as unknown as (AdminOrderRow & { user: UserRow | null })[]
    ).map((o) => ({
      ...o,
      customer: o.user,
    })),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / perPage)),
    page,
    perPage,
  };
}

export async function getOrderForAdmin(id: string) {
  // One query with the relations included — not "load every user and every
  // address, then search them in memory".
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      address: true,
      discountCode: { select: { code: true } },
      items: true,
    },
  });
  if (!order) return null;

  const { user, address, discountCode, items, ...rest } = order;
  return {
    ...rest,
    customer: user,
    address,
    discountCodeText: discountCode?.code ?? null,
    items,
  };
}
