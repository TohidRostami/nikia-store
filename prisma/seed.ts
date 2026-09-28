/**
 * Demo data for development:  npm run db:seed
 *
 * ⚠️  This WIPES the catalog, orders, reviews and discount codes and fills
 * them with sample data (including fake reviewers). It refuses to touch a
 * production or Turso database unless you explicitly pass --force-remote.
 * Users and admin accounts are left alone.
 */
import "dotenv/config";
import { prisma } from "../lib/db";
import {
  CATEGORIES,
  SIZES,
  PRODUCTS,
  DEMO_REVIEWERS,
  DEMO_COMMENTS,
} from "./seed-data";

// Deterministic pseudo-random numbers — the same seed gives the same stock
// and reviews on every run, which makes screenshots and tests repeatable.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const remote = Boolean(process.env.TURSO_DATABASE_URL);
  const forced = process.argv.includes("--force-remote");
  if ((remote || process.env.NODE_ENV === "production") && !forced) {
    console.error(
      "✗ Refusing to seed a remote/production database (this script deletes catalog data).\n" +
        "  Re-run with --force-remote if you really mean it.",
    );
    process.exit(1);
  }

  const rand = mulberry32(1405);

  console.log("→ پاک کردن داده‌های قبلی...");
  await prisma.wishlistItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.color.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.size.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@nikia-demo.local" } },
  });

  console.log("→ سایزها...");
  const sizeIds: string[] = [];
  for (const size of SIZES) {
    sizeIds.push((await prisma.size.create({ data: size })).id);
  }

  console.log("→ دسته‌بندی‌ها...");
  const categoryId = new Map<string, string>();
  for (const cat of CATEGORIES) {
    categoryId.set(cat.slug, (await prisma.category.create({ data: cat })).id);
  }

  console.log("→ کاربران نمونه برای نظرات...");
  const reviewerIds: string[] = [];
  for (const [i, name] of DEMO_REVIEWERS.entries()) {
    const u = await prisma.user.create({
      data: { name, email: `reviewer${i + 1}@nikia-demo.local` },
    });
    reviewerIds.push(u.id);
  }

  console.log("→ محصولات...");
  for (const p of PRODUCTS) {
    const cid = categoryId.get(p.categorySlug);
    if (!cid) continue;

    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        materialCare: p.materialCare,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        categoryId: cid,
        isNew: p.isNew ?? false,
        isFeatured: p.isFeatured ?? false,
      },
    });

    for (const [ci, c] of p.colors.entries()) {
      const color = await prisma.color.create({
        data: { productId: product.id, name: c.name, hexValue: c.hex, sortOrder: ci },
      });
      for (const [si, sizeId] of sizeIds.entries()) {
        // The biggest size of the first product is sold out, like in the design.
        const soldOut = p === PRODUCTS[0] && si === sizeIds.length - 1;
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            colorId: color.id,
            sizeId,
            stock: soldOut ? 0 : Math.floor(rand() * 9) + 2,
          },
        });
      }
    }

    // 3–5 approved reviews per product, centred on the design's rating.
    const count = 3 + Math.floor(rand() * 3);
    for (let r = 0; r < count; r++) {
      const rating = Math.max(
        3,
        Math.min(5, Math.round(p.rating + (rand() - 0.45) * 1.4)),
      );
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: reviewerIds[r % reviewerIds.length],
          rating,
          comment: DEMO_COMMENTS[Math.floor(rand() * DEMO_COMMENTS.length)],
          isApproved: true,
        },
      });
    }

    // Keep Product.inStock consistent with the generated stock.
    const inStock = (await prisma.productVariant.count({
      where: { productId: product.id, stock: { gt: 0 } },
    })) > 0;
    await prisma.product.update({ where: { id: product.id }, data: { inStock } });
  }

  console.log("→ کد تخفیف نمونه...");
  await prisma.discountCode.create({
    data: { code: "NIKIA10", type: "PERCENTAGE", value: 10, isActive: true },
  });

  console.log("→ تنظیمات پیش‌فرض سایت...");
  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    update: { freeShippingThreshold: 2000000, standardShippingCost: 60000 },
    create: {
      id: "singleton",
      freeShippingThreshold: 2000000,
      standardShippingCost: 60000,
    },
  });

  console.log("✓ seed کامل شد.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
