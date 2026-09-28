"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeaderCategory = { slug: string; title: string };

/**
 * The "دسته‌بندی‌ها" item in the desktop nav: a button that opens a small
 * menu of product categories under it. Closes on an outside click, on
 * Escape, when a link inside it is clicked, or when the route changes
 * (e.g. the browser's back button).
 */
export function CategoryNavDropdown({
  categories,
  active,
  pathname,
}: {
  categories: HeaderCategory[];
  /** Highlight the trigger the same way the other nav links are highlighted. */
  active: boolean;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on navigation (e.g. the browser's back button) — adjusted during
  // render instead of in an effect, since it only needs to compare the
  // current and previous pathname, not synchronize with anything external.
  const [seenPathname, setSeenPathname] = useState(pathname);
  if (pathname !== seenPathname) {
    setSeenPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (categories.length === 0) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1.5 border-b-[1.5px] py-[26px] transition-colors",
          active ? "border-ink font-medium" : "border-transparent hover:text-muted-foreground",
        )}
      >
        دسته‌بندی‌ها
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} strokeWidth={1.5} />
      </button>

      {/* Centered under the trigger with physical left/translate-x, so the
          math is identical regardless of the page's RTL direction. */}
      <div
        role="menu"
        aria-label="دسته‌بندی محصولات"
        className={cn(
          "absolute top-full left-1/2 z-50 w-60 -translate-x-1/2 rounded-md border border-hairline bg-white py-2 shadow-[0_12px_40px_rgba(22,20,18,0.08)] transition-all duration-150",
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        {categories.map((c) => (
          <Link
            key={c.slug}
            role="menuitem"
            href={`/products/category/${c.slug}`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm transition-colors hover:bg-sand"
          >
            {c.title}
          </Link>
        ))}
        <Link
          role="menuitem"
          href="/products"
          onClick={() => setOpen(false)}
          className="mt-1 block border-t border-hairline px-4 pb-1 pt-2.5 text-sm text-muted-foreground transition-colors hover:text-ink"
        >
          همه محصولات
        </Link>
      </div>
    </div>
  );
}
