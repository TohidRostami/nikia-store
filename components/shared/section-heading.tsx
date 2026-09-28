import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Eyebrow + heading on the right, "view all" link on the left (RTL). */
export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        {eyebrow && <span className="text-xs text-muted-foreground">{eyebrow}</span>}
        <h2 className="text-[clamp(26px,3vw,36px)] font-normal leading-[1.5]">{title}</h2>
      </div>
      {href && linkLabel && (
        <Link href={href} className="flex items-center gap-2 text-[13px] transition-colors hover:text-muted-foreground">
          {linkLabel}
          <ArrowLeft className="size-4" strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}
