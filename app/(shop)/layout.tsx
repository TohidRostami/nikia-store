import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { RouteTransitionProvider } from "@/components/shared/route-transition-provider";
import { WishlistProvider } from "@/components/shared/wishlist-provider";

// Every storefront page reads the catalog or the session, so none of it is
// built at deploy time — that keeps `next build` independent of the database.
// Hot queries (categories, home sets, settings) are cached for 60s instead.
export const dynamic = "force-dynamic";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <WishlistProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <RouteTransitionProvider>{children}</RouteTransitionProvider>
        </main>
        <SiteFooter />
      </div>
    </WishlistProvider>
  );
}
