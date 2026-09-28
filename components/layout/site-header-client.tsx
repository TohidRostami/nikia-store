"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";
import {
  CategoryNavDropdown,
  type HeaderCategory,
} from "@/components/layout/category-nav-dropdown";
import { MobileCategoryMenu } from "@/components/layout/mobile-category-menu";
import { Logo } from "@/components/shared/logo";
import { SearchDialog } from "@/components/layout/search-dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { useCartCount } from "@/lib/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/lib/content";

function isActive(pathname: string, href: string) {
  const path = href.split("?")[0];
  if (path === "/") return pathname === "/";
  // "/products" must not stay highlighted while browsing "/products/category/manto".
  if (path === "/products")
    return (
      pathname === "/products" ||
      (pathname.startsWith("/products/") &&
        !pathname.startsWith("/products/category/"))
    );
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function SiteHeaderClient({
  announcement,
  links,
  categories,
}: {
  announcement: string;
  links: NavLink[];
  categories: HeaderCategory[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const hydrated = useHydrated();
  const cartCount = useCartCount();

  const iconBtn =
    "relative flex size-11 items-center justify-center transition-colors hover:text-muted-foreground";
  const categoryActive = pathname.startsWith("/products/category/");

  const shopIndex = links.findIndex((l) => l.href === "/products");
  const beforeCategories =
    shopIndex === -1 ? links : links.slice(0, shopIndex + 1);
  const afterCategories = shopIndex === -1 ? [] : links.slice(shopIndex + 1);

  const renderDesktopLink = (l: NavLink) => {
    const active = isActive(pathname, l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "border-b-[0.5px] py-[6px] transition-colors",
          active
            ? "border-ink font-medium"
            : "border-transparent hover:text-muted-foreground",
        )}
      >
        {l.label}
      </Link>
    );
  };

  const renderMobileLink = (l: NavLink) => (
    <Link
      key={l.href}
      href={l.href}
      onClick={() => setMenuOpen(false)}
      className="flex items-center justify-between border-b border-[#f0ebe3] py-3.5 text-base"
    >
      <span className={cn(isActive(pathname, l.href) && "font-medium")}>
        {l.label}
      </span>
      <ArrowLeft className="size-4 text-[#b3a898]" strokeWidth={1.5} />
    </Link>
  );

  return (
    <header className="sticky top-2 z-40 border-1 border-hairline rounded-full bg-paper/65 backdrop-blur-md mx-2 my-2">
      <div className="wrap flex h-[72px] items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="منو"
            className={cn(iconBtn, "lg:hidden")}
          >
            <Menu className="size-[22px]" strokeWidth={1.5} />
          </button>
          <Link href="/" aria-label="نیکیا — صفحه اصلی">
            <Logo />
          </Link>
        </div>

        <nav
          aria-label="منوی اصلی"
          className="hidden items-center gap-[30px] text-sm lg:flex"
        >
          {beforeCategories.map(renderDesktopLink)}
          <CategoryNavDropdown
            categories={categories}
            active={categoryActive}
            pathname={pathname}
          />
          {afterCategories.map(renderDesktopLink)}
        </nav>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="جستجو"
            className={iconBtn}
          >
            <Search className="size-5" strokeWidth={1.5} />
          </button>
          <Link
            href={session ? "/account" : "/login"}
            aria-label={session ? "حساب کاربری" : "ورود یا ثبت‌نام"}
            className="hidden sm:flex relative size-11 items-center justify-center transition-colors hover:text-muted-foreground"
          >
            <User className="size-5" strokeWidth={1.5} />
          </Link>
          <Link href="/cart" aria-label="سبد خرید" className={iconBtn}>
            <ShoppingBag className="size-5" strokeWidth={1.5} />
            {hydrated && cartCount > 0 && (
              <span className="absolute left-[5px] top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-ink px-1 text-[10px] text-paper">
                {toPersianDigits(cartCount)}
              </span>
            )}
          </Link>
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="flex h-dvh flex-col gap-0 p-0">
          <SheetTitle className="sr-only">منوی سایت</SheetTitle>

          <SheetDescription className="sr-only">
            پیوندهای اصلی فروشگاه
          </SheetDescription>

          {/* Logo */}
          <div className="shrink-0 border-b border-hairline px-5 py-5">
            <Logo />
          </div>

          {/* Mobile Menu */}
          <nav
            aria-label="منوی موبایل"
            className="min-h-0 flex-1 overflow-y-auto px-5 py-2"
          >
            {beforeCategories.map(renderMobileLink)}

            <MobileCategoryMenu
              categories={categories}
              active={categoryActive}
              onNavigate={() => setMenuOpen(false)}
            />

            {afterCategories.map(renderMobileLink)}
          </nav>

          {/* Account */}
          <div className="shrink-0 border-t border-hairline px-5 py-4">
            <Link
              href={session ? "/account" : "/login"}
              onClick={() => setMenuOpen(false)}
              aria-label={session ? "حساب کاربری" : "ورود یا ثبت‌نام"}
              className="flex w-full items-center justify-center  gap-1 border border-hairline rounded-full py-2 text-base transition-colors hover:text-muted-foreground"
            >
              <User className="size-5" strokeWidth={1.5} />
              <span>ورود به حساب کاربری</span>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
