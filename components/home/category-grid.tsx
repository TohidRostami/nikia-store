import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CategoryImage } from "@/components/home/category-image";
import { SectionHeading } from "@/components/shared/section-heading";
import type { CategoryDTO } from "@/lib/types";

/** "Shop by category": the first four categories as large photo tiles. */
export function CategoryGrid({
  eyebrow,
  title,
  categories,
}: {
  eyebrow: string;
  title: string;
  categories: CategoryDTO[];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="wrap pt-[clamp(56px,7vw,88px)]">
      <SectionHeading eyebrow={eyebrow} title={title} href="/products" linkLabel="همه دسته‌بندی‌ها" />
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {categories.slice(0, 4).map((cat) => (
          <Link
            key={cat.id}
            href={`/products/category/${cat.slug}`}
            className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-[#e7dfd3]"
          >
            <CategoryImage category={cat} sizes="(min-width: 1024px) 25vw, 50vw" zoom />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-ink/55 to-transparent px-5 pb-5 pt-[60px] text-white">
              <span className="text-[19px] font-medium">{cat.title}</span>
              <span className="flex items-center gap-2 text-[13px]">
                مشاهده <ArrowLeft className="size-3.5" strokeWidth={1.5} />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
