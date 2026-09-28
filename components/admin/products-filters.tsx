"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useRouteTransition } from "@/components/shared/route-transition-provider";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = {
  id: string;
  title: string;
  slug: string;
};

type ProductsFiltersProps = {
  categories: Category[];
};

export function ProductsFilters({ categories }: ProductsFiltersProps) {
  const { push } = useRouteTransition();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = React.useState(urlSearch);

  // Keep the box in step with the URL (back/forward, "clear filters") —
  // adjusted during render, which is React's recommended alternative to an effect.
  const [seenUrlSearch, setSeenUrlSearch] = React.useState(urlSearch);
  if (urlSearch !== seenUrlSearch) {
    setSeenUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    // Any filter change narrows/changes the result set, so whatever page
    // you were on may no longer exist (or may now show different
    // products) — always land back on page 1.
    params.delete("page");

    push(`/admin/products?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("search", search);
  }

  function clearFilters() {
    setSearch("");
    push("/admin/products");
  }

  // "page" alone (no real filter) shouldn't count as an active filter.
  const hasFilters = Array.from(searchParams.keys()).some(
    (key) => key !== "page",
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col gap-3 md:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در نام محصولات..."
            className="pe-10"
          />
        </div>

        <Button variant="accent" type="submit">
          جستجو
        </Button>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {/* Category */}
        <Select
          value={searchParams.get("category") ?? "all"}
          onValueChange={(value) => updateFilter("category", value)}
        >
          <SelectTrigger
            size="sm"
            aria-label="دسته بندی محصولات"
            className="h-9 w-full sm:w-fit rounded-md border border-input bg-background px-3 text-sm"
            dir="rtl"
          >
            <SelectValue placeholder="همه دسته بندی ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="justify-end text-right text-xs">
              <span>همه دسته‌بندی‌ها</span>
            </SelectItem>
            {categories.map((category) => (
              <SelectItem
                key={category.id}
                value={category.slug}
                className="justify-end text-right text-xs"
              >
                <span>{category.title}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={searchParams.get("status") ?? "all"}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger
            size="sm"
            aria-label="وضعیت محصولات"
            className="h-9 w-full sm:w-fit rounded-md border border-input bg-background px-3 text-sm"
            dir="rtl"
          >
            <SelectValue placeholder="همه وضعیت‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="justify-end text-right text-xs">
              <span>همه وضعیت‌ها</span>
            </SelectItem>
            <SelectItem
              value="published"
              className="justify-end text-right text-xs"
            >
              <span>منتشرشده</span>
            </SelectItem>
            <SelectItem
              value="draft"
              className="justify-end text-right text-xs"
            >
              <span>پیش‌نویس</span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Featured */}
        <Select
          value={searchParams.get("featured") ?? "all"}
          onValueChange={(value) => updateFilter("featured", value)}
        >
          <SelectTrigger
            size="sm"
            aria-label="ویژگی محصولات"
            className="h-9 w-full sm:w-fit rounded-md border border-input bg-background px-3 text-sm"
            dir="rtl"
          >
            <SelectValue placeholder="همه محصولات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="justify-end text-right text-xs">
              <span>همه محصولات</span>
            </SelectItem>
            <SelectItem value="true" className="justify-end text-right text-xs">
              <span>فقط محصولات ویژه</span>
            </SelectItem>
            <SelectItem
              value="false"
              className="justify-end text-right text-xs"
            >
              <span>غیر ویژه</span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={searchParams.get("sort") ?? "newest"}
          onValueChange={(value) => updateFilter("sort", value)}
        >
          <SelectTrigger
            size="sm"
            aria-label="چیدمان محصولات"
            className="h-9 w-full sm:w-fit rounded-md border border-input bg-background px-3 text-sm"
            dir="rtl"
          >
            <SelectValue placeholder="جدیدترین" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              value="newest"
              className="justify-end text-right text-xs"
            >
              <span>جدیدترین</span>
            </SelectItem>
            <SelectItem
              value="oldest"
              className="justify-end text-right text-xs"
            >
              <span>قدیمی‌ترین</span>
            </SelectItem>
            <SelectItem
              value="name-asc"
              className="justify-end text-right text-xs"
            >
              <span>نام: الف تا ی</span>
            </SelectItem>
            <SelectItem
              value="name-desc"
              className="justify-end text-right text-xs"
            >
              <span>نام: ی تا الف</span>
            </SelectItem>
            <SelectItem
              value="price-desc"
              className="justify-end text-right text-xs"
            >
              <span>قیمت: زیاد به کم</span>
            </SelectItem>
            <SelectItem
              value="price-asc"
              className="justify-end text-right text-xs"
            >
              <span>قیمت: کم به زیاد</span>
            </SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            size="sm"
          >
            <X className="size-4" />
            پاک کردن فیلترها
          </Button>
        )}
      </div>
    </div>
  );
}
