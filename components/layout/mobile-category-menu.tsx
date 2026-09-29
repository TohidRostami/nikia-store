"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeaderCategory } from "@/components/layout/category-nav-dropdown";

export function MobileCategoryMenu({
  categories,
  active,
  onNavigate,
}: {
  categories: HeaderCategory[];
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

        <ChevronDown
          className={cn(
            "size-4 text-[#b3a898] transition-transform duration-300 ease-out",
            open && "rotate-180",
          )}
          strokeWidth={1.5}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-0.5 pb-3.5">
            {categories.map((category, index) => (
              <Link
                key={category.slug}
                href={`/products/category/${category.slug}`}
                onClick={onNavigate}
                className={cn(
                  "rounded-md px-3 py-2.5 text-[15px] text-body",
                  "transition-all duration-300 ease-out",
                  "hover:bg-sand",
                  open
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-1.5 opacity-0",
                )}
                style={{
                  transitionDelay: open ? `${index * 40}ms` : "0ms",
                }}
              >
                {category.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
