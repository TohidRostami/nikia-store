"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";

/** Crossfading hero photos with a vertical index (۰۱ / ۰۲ …), as in the design. One image = no chrome. */
export function HeroSlider({ images, alt }: { images: { id: string; url: string }[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const many = images.length > 1;

  useEffect(() => {
    if (!many || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % images.length), 6000);
    return () => clearInterval(timer);
  }, [many, images.length]);

  return (
    <>
      {images.map((img, i) => (
        <Image
          key={img.id}
          src={img.url}
          alt={alt}
          fill
          priority={i === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={cn("object-contain transition-opacity duration-1000", i === index ? "opacity-100" : "opacity-0")}
        />
      ))}
      {many && (
        <div className="absolute left-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2.5 text-xs">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`تصویر ${toPersianDigits(i + 1)}`}
              aria-current={i === index}
              className="flex flex-col items-center gap-2.5 rounded-full bg-paper/70 px-1.5 py-1 backdrop-blur-sm"
            >
              <span className={i === index ? "font-semibold" : "text-muted-foreground"}>
                {toPersianDigits(String(i + 1).padStart(2, "0"))}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
