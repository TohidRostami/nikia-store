"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { getWishlistIds, toggleWishlist } from "@/app/(shop)/actions";

type WishlistContextValue = {
  ids: ReadonlySet<string>;
  isLiked: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
};

const EMPTY: ReadonlySet<string> = new Set();
const WishlistContext = createContext<WishlistContextValue>({
  ids: EMPTY,
  isLiked: () => false,
  toggle: async () => {},
});

/**
 * Keeps the signed-in customer's wishlist in the browser so the hearts on
 * product cards can respond instantly — and so the pages themselves stay
 * cacheable instead of being rendered per user.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const [loaded, setLoaded] = useState<{ userId: string; ids: Set<string> } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    getWishlistIds().then((list) => {
      if (alive) setLoaded({ userId, ids: new Set(list) });
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const ids = userId && loaded?.userId === userId ? loaded.ids : EMPTY;

  const toggle = useCallback(
    async (productId: string) => {
      if (!userId) {
        toast("برای ذخیره‌ی محصول وارد حساب خود شوید.");
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      const wasLiked = ids.has(productId);
      const apply = (liked: boolean) =>
        setLoaded((prev) => {
          const next = new Set(prev?.ids ?? []);
          if (liked) next.add(productId);
          else next.delete(productId);
          return { userId, ids: next };
        });

      apply(!wasLiked); // optimistic
      const result = await toggleWishlist(productId);
      if (!result.ok) {
        apply(wasLiked);
        toast.error("ذخیره‌ی محصول انجام نشد.");
        return;
      }
      apply(result.liked);
      toast.success(result.liked ? "به علاقه‌مندی‌ها اضافه شد" : "از علاقه‌مندی‌ها حذف شد");
    },
    [userId, ids, pathname, router],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({ ids, isLiked: (id) => ids.has(id), toggle }),
    [ids, toggle],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
