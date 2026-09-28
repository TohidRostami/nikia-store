"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import { searchProductsAction } from "@/app/(shop)/actions";
import { formatPrice } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductDTO[] | null>(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  // Debounced search; stale responses (an earlier, slower request) are dropped.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      const found = await searchProductsAction(q);
      if (id === requestId.current) {
        setResults(found);
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const showResults = query.trim().length >= 2 ? results : null;

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setResults(null);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    close(false);
    router.push(`/products?q=${encodeURIComponent(q)}`);
  }

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="top" className="gap-0 p-0 [&>button]:hidden">
        <SheetTitle className="sr-only">جستجو در محصولات</SheetTitle>
        <SheetDescription className="sr-only">نام محصول یا دسته‌بندی را بنویسید.</SheetDescription>
        <div className="wrap w-full py-5">
          <form onSubmit={submit} className="flex items-center gap-3 border-b border-line pb-3">
            <Search className="size-5 text-muted-foreground" strokeWidth={1.5} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو: مانتو، شومیز، پیراهن…"
              className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground"
            />
            <button type="button" onClick={() => close(false)} aria-label="بستن" className="p-1 text-muted-foreground hover:text-ink">
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </form>

          <div className="max-h-[60vh] overflow-y-auto py-4" aria-live="polite">
            {loading && !showResults && <p className="py-6 text-center text-sm text-muted-foreground">در حال جستجو…</p>}
            {showResults && showResults.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">محصولی با این عبارت پیدا نشد.</p>
            )}
            {showResults && showResults.length > 0 && (
              <ul className="grid gap-1 sm:grid-cols-2">
                {showResults.map((p) => {
                  const img = p.images[0];
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={() => close(false)}
                        className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-sand"
                      >
                        <span className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-sand">
                          {img ? (
                            <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
                          ) : (
                            <ProductPlaceholder categorySlug={p.category.slug} tint={p.colors[0]?.hexValue} />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{p.name}</span>
                          <span className="block text-xs text-muted-foreground">{p.category.title}</span>
                          <span className="block text-sm">{formatPrice(p.price)} تومان</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {!showResults && !loading && query.trim().length < 2 && (
              <p className="py-6 text-center text-sm text-muted-foreground">حداقل دو حرف بنویسید و Enter بزنید.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
