import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/content";

/** The wordmark: «نیکیا» over tracked-out NIKIA. Pure text, so it's crisp at any size and needs no image file. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex flex-col items-start gap-1 leading-none", className)}
      aria-label={siteConfig.site.name}
    >
      <span className="text-xl sm:text-2xl font-semibold tracking-tight text-center">{siteConfig.site.name}</span>
      <span dir="ltr" className="text-[10px] sm:text-[12px] tracking-[5px] text-muted-foreground text-center">
        {siteConfig.site.nameLatin}
      </span>
    </span>
  );
}

/** Same wordmark for dark backgrounds (admin sidebar). */
export function WhiteLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex flex-col items-start gap-1 leading-none text-sidebar-foreground", className)}
      aria-label={siteConfig.site.name}
    >
      <span className="text-2xl font-semibold tracking-tight">{siteConfig.site.name}</span>
      <span dir="ltr" className="text-[9px] tracking-[5px] text-sidebar-foreground/60">
        {siteConfig.site.nameLatin}
      </span>
    </span>
  );
}
