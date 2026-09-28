import { prisma } from "@/lib/db";

/** Statuses that count as real, paid revenue. */
const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export async function getDashboardStats() {
  // Aggregated in the database — the dashboard must not download every order.
  const [byStatus, productCount, customerCount] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { isArchived: false } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  const statusCounts: Record<string, number> = {};
  let orderCount = 0;
  let paidOrderCount = 0;
  let revenue = 0;
  for (const row of byStatus) {
    statusCounts[row.status] = row._count._all;
    orderCount += row._count._all;
    if (PAID_STATUSES.includes(row.status)) {
      paidOrderCount += row._count._all;
      revenue += row._sum.total ?? 0;
    }
  }

  return { revenue, orderCount, paidOrderCount, productCount, customerCount, statusCounts };
}
