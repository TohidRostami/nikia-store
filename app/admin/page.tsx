import type { Metadata } from "next";
import { Wallet, ShoppingBag, Package, Users } from "lucide-react";

import { StatCard } from "@/components/admin/stat-card";
import { OutOfStockCard } from "@/components/admin/out-of-stock-card";
import { getDashboardStats } from "@/lib/queries/admin";
import {
  getLowStockProducts,
  getOutOfStockProducts,
} from "@/lib/queries/admin-inventory";
import { formatPrice } from "@/lib/format";
import { LowStockCard } from "@/components/admin/low-stock-card";

export const metadata: Metadata = { title: "داشبورد | پنل مدیریت" };

export default async function AdminDashboardPage() {
  const [stats, outOfStockProducts, lowStockProducts] = await Promise.all([
    getDashboardStats(),
    getOutOfStockProducts(),
    getLowStockProducts(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">داشبورد</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          نمای کلی فروشگاه نیکیا
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="درآمد کل"
          value={formatPrice(stats.revenue)}
          unit="تومان"
          icon={Wallet}
        />
        <StatCard
          label="تعداد سفارش‌ها"
          value={stats.orderCount}
          icon={ShoppingBag}
        />
        <StatCard
          label="محصولات فعال"
          value={stats.productCount}
          icon={Package}
        />
        <StatCard label="مشتریان" value={stats.customerCount} icon={Users} />
      </div>

      <OutOfStockCard products={outOfStockProducts} />

      <LowStockCard products={lowStockProducts} />
    </div>
  );
}
