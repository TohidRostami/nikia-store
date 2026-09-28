"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { CategoryImage } from "@/components/home/category-image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/lib/types";

const AUTOPLAY_DELAY_MS = 4500;

/**
 * Tracks the carousel's current page and page count off the Embla `api`
 * object via useSyncExternalStore — the same pattern this project already
 * uses for browser APIs (see useHydrated) — instead of an effect that pokes
 * state directly, which both avoids a lint warning and is the more correct
 * tool for "subscribe to an external, already-imperative object".
 */
function useCarouselSnap(api: CarouselApi) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!api) return () => {};
      api.on("select", onChange);
      api.on("reInit", onChange);
      return () => {
        api.off("select", onChange);
        api.off("reInit", onChange);
      };
    },
    [api],
  );
  const selectedIndex = useSyncExternalStore(
    subscribe,
    () => api?.selectedScrollSnap() ?? 0,
    () => 0,
  );
  const snapCount = useSyncExternalStore(
    subscribe,
    () => api?.scrollSnapList().length ?? 0,
    () => 0,
  );
  return { selectedIndex, snapCount };
}

export function CategoryStrip({ categories }: { categories: CategoryDTO[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const { selectedIndex, snapCount } = useCarouselSnap(api);

  // Autoplay respects "reduced motion" the moment the carousel is ready —
  // Embla itself has no such setting built in.
  useEffect(() => {
    if (!api) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      api.plugins().autoplay?.stop();
    }
  }, [api]);

  if (categories.length === 0) return null;

  return (
    <section className="wrap relative z-[2] -mt-16">
      <div className="rounded-[10px] bg-white px-[clamp(16px,3vw,36px)] py-6 shadow-[0_12px_40px_rgba(22,20,18,0.06)]">
        <h2 className="mb-5 text-center text-sm font-semibold tracking-wide text-ink">
          دسته‌بندی‌ها
        </h2>

        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "start", dragFree: false }}
          plugins={[
            Autoplay({
              delay: AUTOPLAY_DELAY_MS,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
              stopOnFocusIn: true,
            }),
          ]}
        >
          <CarouselContent className="justify-between">
            {categories.map((cat) => (
              <CarouselItem
                key={cat.id}
                className="basis-1/3 sm:basis-1/5 lg:basis-[12.5%]"
              >
                <Link
                  href={`/products/category/${cat.slug}`}
                  className="flex flex-col items-center gap-2.5 text-[13px]"
                >
                  <span className="relative block size-[84px] overflow-hidden rounded-full bg-sand">
                    <CategoryImage category={cat} sizes="84px" />
                  </span>
                  <span className="truncate">{cat.title}</span>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {snapCount > 1 && (
          <div className="mt-5 flex justify-center gap-2">
            {Array.from({ length: snapCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`دسته‌بندی‌های صفحه ${toPersianDigits(i + 1)}`}
                aria-current={i === selectedIndex}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === selectedIndex ? "w-3 bg-ink" : "w-1.5 bg-line",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
