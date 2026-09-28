import type { Metadata } from "next";
import Link from "next/link";
import { SizeGuideTable } from "@/components/shop/size-guide-table";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "راهنمای سایز",
  description: "جدول اندازه‌ها و روش اندازه‌گیری برای انتخاب سایز مناسب.",
  alternates: { canonical: "/size-guide" },
};

const HOW_TO = [
  { title: "دور سینه", text: "متر را از پهن‌ترین قسمت سینه رد کنید؛ نه خیلی سفت و نه شل." },
  { title: "دور کمر", text: "از باریک‌ترین قسمت کمر، حدود یک بند انگشت بالای ناف اندازه بگیرید." },
  { title: "قد", text: "طول لباس یا مانتوی دلخواهتان را اندازه بگیرید و با ستون «قد» مقایسه کنید." },
];

export default async function SizeGuidePage() {
  const sizes = await prisma.size.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, description: true } });

  return (
    <>
      <section className="bg-sand">
        <div className="wrap flex flex-col gap-2.5 py-[clamp(28px,4vw,48px)]">
          <nav aria-label="مسیر" className="flex gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-ink">خانه</Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">راهنمای سایز</span>
          </nav>
          <h1 className="text-[clamp(28px,4vw,44px)] font-normal">راهنمای سایز</h1>
          <p className="max-w-xl text-sm leading-8 text-body">اندازه‌های بدن خود را با جدول زیر مقایسه کنید. اگر بین دو سایز بودید، بسته به راحتی دلخواه، سایز بزرگ‌تر را انتخاب کنید.</p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-12 px-4 pt-[clamp(32px,5vw,56px)] sm:px-6">
        <SizeGuideTable sizes={sizes} />
        <section>
          <h2 className="mb-5 text-xl font-medium">روش اندازه‌گیری</h2>
          <ol className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            {HOW_TO.map((h) => (
              <li key={h.title} className="rounded-lg bg-sand p-5">
                <b className="text-sm font-semibold">{h.title}</b>
                <p className="mt-2 text-[13px] leading-8 text-body">{h.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
