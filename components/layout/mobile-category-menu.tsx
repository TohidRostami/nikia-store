"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeaderCategory } from "@/components/layout/category-nav-dropdown";

/**
 * The "دسته‌بندی‌ها" row inside the mobile menu (Sheet): tapping it expands
 * an inline list of categories, instead of navigating away like the other
 * rows do. Picking a category closes the whole menu via `onNavigate`.
 */
export function MobileCategoryMenu({
  categories,
  active,
  onNavigate,
}: {
  categories: HeaderCategory[];
  /** Start expanded when a category page is already open. */
  active: boolean;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(active);

  if (categories.length === 0) return null;

  return (
    <div className="border-b border-[#f0ebe3]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3.5 text-base"
      >
        <span className={cn(active && "font-medium")}>دسته‌بندی‌ها</span>
        <ChevronDown className={cn("size-4 text-[#b3a898] transition-transform", open && "rotate-180")} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 pb-3.5">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/products/category/${c.slug}`}
              onClick={onNavigate}
              className="rounded-md px-3 py-2.5 text-[15px] text-body transition-colors hover:bg-sand"
            >
              {c.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
