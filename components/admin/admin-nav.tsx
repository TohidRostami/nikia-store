"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Ruler,
  ShoppingBag,
  Tag,
  Users,
  Settings,
  ExternalLink,
  Store,
  MessageSquare,
  Mail,
} from "lucide-react";

import { WhiteLogo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: FolderTree },
  { href: "/admin/sizes", label: "سایزها", icon: Ruler },
  { href: "/admin/pos", label: "خرید حضوری", icon: Store },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag },
  { href: "/admin/discounts", label: "کدهای تخفیف", icon: Tag },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/messages", label: "پیام‌ها", icon: MessageSquare },
  { href: "/admin/subscribers", label: "خبرنامه", icon: Mail },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
];

// The only sections subAdmin may see — kept as a lookup set rather than
// splitting NAV in two, so NAV above stays the single source of truth
// for order/icons/labels. This is a UI-only convenience: the *real*
// enforcement is requireAdmin()/requireAdminOrSubAdmin() on each page
// and action — hiding a link never substitutes for that.
const SUBADMIN_ALLOWED_HREFS = new Set([
  "/admin",
  "/admin/products",
  "/admin/categories",
  "/admin/sizes",
  "/admin/pos",
]);

export function AdminNav({
  onNavigate,
  role,
}: {
  onNavigate?: () => void;
  role?: string;
}) {
  const pathname = usePathname();
  const visibleNav =
    role === "SUBADMIN"
      ? NAV.filter((item) => SUBADMIN_ALLOWED_HREFS.has(item.href))
      : NAV;

  return (
    <div className="flex h-full flex-col text-sidebar-foreground">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/admin" className="[&_span]:text-sidebar-foreground">
          <WhiteLogo />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {visibleNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4" strokeWidth={1.6} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <ExternalLink className="size-4" strokeWidth={1.6} />
          بازگشت به فروشگاه
        </Link>
      </div>
    </div>
  );
}
