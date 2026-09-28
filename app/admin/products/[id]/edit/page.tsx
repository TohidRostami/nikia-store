import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { getAllCategories, getProductForEdit } from "@/lib/queries/admin-products";
import { getAllSizes } from "@/lib/queries/admin-sizes";

export const metadata: Metadata = { title: "ویرایش محصول | پنل مدیریت" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [categories, sizes, product] = await Promise.all([
    getAllCategories(),
    getAllSizes(),
    getProductForEdit(id),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">ویرایش محصول</h1>
      <ProductForm categories={categories} sizes={sizes} product={product} />
    </div>
  );
}