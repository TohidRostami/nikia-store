"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/components/shared/wishlist-provider";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  className,
  size = "sm",
}: {
  productId: string;
  className?: string;
  size?: "sm" | "lg";
}) {
  const { isLiked, toggle } = useWishlist();
  const liked = isLiked(productId);

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(productId);
      }}
      className={cn(
        "flex items-center justify-center rounded-full bg-paper/90 text-ink transition-colors hover:bg-white",
        size === "sm" ? "size-9" : "size-12 border border-line bg-white hover:bg-sand",
        className,
      )}
    >
      <Heart className={size === "sm" ? "size-[17px]" : "size-5"} strokeWidth={1.5} fill={liked ? "currentColor" : "none"} />
    </button>
  );
}
