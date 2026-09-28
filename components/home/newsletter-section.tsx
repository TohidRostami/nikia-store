import { NewsletterForm } from "@/components/layout/newsletter-form";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import type { SiteConfig } from "@/lib/content";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function NewsletterSection({
  content,
}: {
  content: SiteConfig["home"]["newsletter"];
}) {
  return (
    <section className="wrap pt-4">
      <div className="flex flex-wrap overflow-hidden rounded-lg bg-sand-2">
        <div className="relative min-h-[260px] flex-[1_1_300px]">
          <Image
            src={"/about-us.webp"}
            alt="about us"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={"object-fit transition-opacity duration-1000"}
          />
        </div>
        <div className="flex flex-[1.4_1_360px] flex-col justify-center gap-3.5 p-[clamp(28px,4vw,56px)]">
          <span className="text-xs text-muted-foreground">
            {content.eyebrow}
          </span>
          <h2 className="text-[clamp(24px,2.8vw,34px)] font-normal">
            {content.title}
          </h2>
          <p className="text-sm leading-8 text-body">{content.description}</p>
          <Link
            href="/about"
            className="mt-2 flex items-center gap-2 self-start rounded-sm bg-ink px-5 py-3 text-[13px] text-paper transition-colors hover:bg-ink/90"
          >
            <span>درباره‌ی نیکیا</span>
            <ArrowLeft className="size-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
