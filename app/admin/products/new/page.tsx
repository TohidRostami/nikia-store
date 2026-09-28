import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { getAllCategories } from "@/lib/queries/admin-products";
import { getAllSizes } from "@/lib/queries/admin-sizes";

export const metadata: Metadata = { title: "محصول جدید | پنل مدیریت" };

export default async function NewProductPage() {
  const [categories, sizes] = await Promise.all([
    getAllCategories(),
    getAllSizes(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">محصول جدید</h1>
      <ProductForm categories={categories} sizes={sizes} />
    </div>
  );
}
