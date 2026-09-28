"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "داشبورد", href: "/account" },
  { label: "سفارش‌های من", href: "/account/orders" },
  { label: "علاقه‌مندی‌ها", href: "/account/wishlist" },
  { label: "آدرس‌ها", href: "/account/addresses" },
  { label: "اطلاعات حساب", href: "/account/profile" },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav aria-label="منوی حساب کاربری" className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
      {TABS.map((t) => {
        const active = t.href === "/account" ? pathname === "/account" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-md px-4 py-[13px] text-sm transition-colors",
              active ? "bg-ink text-paper" : "hover:bg-sand",
            )}
          >
            {t.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          router.push("/");
          router.refresh();
        }}
        className="shrink-0 whitespace-nowrap rounded-md px-4 py-[13px] text-right text-sm text-sale transition-colors hover:bg-sand"
      >
        خروج
      </button>
    </nav>
  );
}
