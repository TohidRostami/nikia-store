import { cn } from "@/lib/utils";
import { GarmentGlyph, garmentKind } from "@/components/shared/garment-glyph";

/**
 * Stands in for a product photo until one is uploaded. Tinted with the
 * product's first color so a grid of unphotographed products still reads
 * as different garments rather than identical grey boxes.
 */
export function ProductPlaceholder({
  categorySlug,
  tint,
  className,
}: {
  categorySlug?: string | null;
  tint?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn("flex size-full items-center justify-center bg-sand text-ink/35", className)}
      style={
        tint
          ? { background: `color-mix(in srgb, ${tint} 22%, var(--brand-sand))` }
          : undefined
      }
    >
      <GarmentGlyph kind={garmentKind(categorySlug)} />
    </div>
  );
}
