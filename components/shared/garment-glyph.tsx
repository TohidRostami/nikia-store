import { cn } from "@/lib/utils";

export type GarmentKind = "manto" | "shomiz" | "tshirt" | "dress" | "jeans" | "skirt";

const KNOWN: GarmentKind[] = ["manto", "shomiz", "tshirt", "dress", "jeans", "skirt"];

/** Maps a category slug to a silhouette; unknown categories fall back to a dress. */
export function garmentKind(categorySlug: string | null | undefined): GarmentKind {
  return (KNOWN as string[]).includes(categorySlug ?? "") ? (categorySlug as GarmentKind) : "dress";
}

const PATHS: Record<GarmentKind, string[]> = {
  tshirt: ["M30 20 L42 16 Q50 24 58 16 L70 20 L88 36 L78 46 L70 40 L70 100 L30 100 L30 40 L22 46 L12 36 Z"],
  shomiz: [
    "M32 18 L44 14 L50 22 L56 14 L68 18 L90 60 L80 64 L70 44 L70 104 L30 104 L30 44 L20 64 L10 60 Z",
    "M50 22 L50 104",
  ],
  manto: [
    "M34 14 L46 12 L50 20 L54 12 L66 14 L86 40 L84 98 L74 98 L72 52 L70 112 L30 112 L28 52 L26 98 L16 98 L14 40 Z",
    "M50 20 L50 112",
  ],
  dress: ["M40 12 L46 12 Q50 20 54 12 L60 12 L64 44 L84 112 L16 112 L36 44 Z", "M36 44 L64 44"],
  jeans: ["M30 10 L70 10 L74 112 L54 112 L50 40 L46 112 L26 112 Z", "M30 20 L70 20"],
  skirt: ["M32 20 L68 20 L86 108 L14 108 Z", "M32 30 L68 30"],
};

/** A quiet line-drawing of a garment, used wherever a product has no photo yet. */
export function GarmentGlyph({ kind, className }: { kind: GarmentKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={cn("h-1/2 w-1/2", className)}
      aria-hidden="true"
    >
      {PATHS[kind].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
