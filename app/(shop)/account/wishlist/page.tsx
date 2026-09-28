import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/shared/product-card";
import { prisma } from "@/lib/db";
import { getProductsByIds } from "@/lib/queries/products";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "علاقه‌مندی‌ها", robots: { index: false } };

export default async function WishlistPage() {
  const session = await requireUser("/account/wishlist");
  const rows = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { productId: true },
  });
  const products = await getProductsByIds(rows.map((r) => r.productId));

  return (
    <>
      <h1 className="text-[clamp(24px,3vw,32px)] font-normal">علاقه‌مندی‌ها</h1>
      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="فهرست علاقه‌مندی‌های شما خالی است"
          description="روی قلب کنار هر محصول بزنید تا اینجا ذخیره شود."
          actionLabel="مشاهده محصولات"
          actionHref="/products"
        />
      ) : (
        <div className="grid gap-[clamp(12px,2vw,20px)] [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
