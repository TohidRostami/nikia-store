import { prisma } from "@/lib/db";

export const ADDRESS = {
  fullName: "سارا محمدی",
  phone: "۰۹۱۲۱۲۳۴۵۶۷", // Persian digits on purpose — they must be normalised
  province: "تهران",
  city: "تهران",
  addressLine: "خیابان ولیعصر، کوچه نسترن، پلاک ۱۲",
  postalCode: "1596634578",
};

export type Ctx = {
  userId: string;
  productId: string;
  variantId: string;
  simpleProductId: string;
};

export async function reset(): Promise<Ctx> {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.color.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.size.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({ data: { name: "Test", email: "t@example.com" } });
  const category = await prisma.category.create({ data: { slug: "c", title: "c" } });
  const size = await prisma.size.create({ data: { name: "40" } });

  const product = await prisma.product.create({
    data: { slug: "p", name: "مانتو", description: "d", price: 1_000_000, categoryId: category.id },
  });
  const color = await prisma.color.create({ data: { productId: product.id, name: "کرم" } });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, sizeId: size.id, colorId: color.id, stock: 3 },
  });

  const simple = await prisma.product.create({
    data: { slug: "s", name: "ساده", description: "d", price: 500_000, categoryId: category.id },
  });

  await prisma.siteSetting.create({
    data: { id: "singleton", freeShippingThreshold: 2_000_000, standardShippingCost: 60_000 },
  });

  return { userId: user.id, productId: product.id, variantId: variant.id, simpleProductId: simple.id };
}

