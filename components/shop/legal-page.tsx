import Link from "next/link";
import type { TextSection } from "@/lib/content";

/** A text page (policies) built from config sections; each section id is an anchor (#shipping, #returns…). */
export function LegalPage({ title, sections }: { title: string; sections: TextSection[] }) {
  return (
    <>
      <section className="bg-sand">
        <div className="wrap flex flex-col gap-2.5 py-[clamp(28px,4vw,48px)]">
          <nav aria-label="مسیر" className="flex gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-ink">خانه</Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{title}</span>
          </nav>
          <h1 className="text-[clamp(28px,4vw,44px)] font-normal">{title}</h1>
        </div>
      </section>
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-12 px-4 pt-[clamp(32px,5vw,56px)] sm:px-6">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-32">
            <h2 className="mb-4 text-xl font-medium">{s.title}</h2>
            <div className="flex flex-col gap-3">
              {s.paragraphs.map((p) => (
                <p key={p} className="text-[15px] leading-[2.2] text-body [text-wrap:pretty]">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
