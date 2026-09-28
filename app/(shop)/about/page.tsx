import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import { siteConfig } from "@/lib/content";
import { toPersianDigits } from "@/lib/format";

const a = siteConfig.about;
export const metadata: Metadata = {
  title: "درباره ما",
  description: siteConfig.site.shortDescription,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto flex max-w-[1100px] flex-col items-center gap-6 px-4 pb-[clamp(40px,6vw,72px)] pt-[clamp(56px,9vw,120px)] text-center sm:px-6">
        <span className="text-xs tracking-[1px] text-muted-foreground">{a.eyebrow}</span>
        <h1 className="text-[clamp(34px,5.4vw,68px)] font-light leading-[1.45] [text-wrap:balance]">
          {a.headlinePre} <b className="font-semibold">{a.headlineBold1}</b> {a.headlineMid} <b className="font-semibold">{a.headlineBold2}</b> {a.headlinePost}
        </h1>
      </section>

      <section className="wrap">
        <div className="aspect-[21/9] min-h-[260px] overflow-hidden rounded-lg">
          <ProductPlaceholder categorySlug="manto" tint="#D9CBB5" className="bg-[#e9e1d5] [&_svg]:h-1/3 [&_svg]:w-1/3" />
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pt-[clamp(56px,8vw,104px)] sm:px-6">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          <span className="text-xs text-muted-foreground">{a.storyEyebrow}</span>
          <h2 className="text-[clamp(26px,3.4vw,40px)] font-normal leading-[1.5]">{a.storyTitle}</h2>
          {a.story.map((p) => (
            <p key={p} className="text-[15px] leading-[2.2] text-body [text-wrap:pretty]">
              {p}
            </p>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pt-[clamp(56px,8vw,104px)] sm:px-6">
        <ul className="grid gap-px overflow-hidden rounded-lg border border-[#e2dace] bg-[#e2dace] [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {a.values.map((v, i) => (
            <li key={v.title} className="flex flex-col gap-3 bg-paper p-[clamp(24px,3vw,36px)]">
              <span className="text-xs text-muted-foreground">{toPersianDigits(String(i + 1).padStart(2, "0"))}</span>
              <h3 className="text-lg font-medium">{v.title}</h3>
              <p className="text-sm leading-[2] text-body">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto flex max-w-[1100px] flex-col items-center gap-5 px-4 pt-[clamp(56px,8vw,104px)] text-center sm:px-6">
        <h2 className="text-[clamp(24px,3vw,34px)] font-normal">{a.cta.title}</h2>
        <Link href={a.cta.href} className="flex items-center gap-3 rounded-sm bg-ink px-8 py-[15px] text-sm text-paper transition-colors hover:bg-ink/90">
          {a.cta.label}
          <ArrowLeft className="size-4" strokeWidth={1.5} />
        </Link>
      </section>
    </>
  );
}
