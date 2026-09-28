import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/category-form";
import { getAllCategories } from "@/lib/queries/admin-products";

export const metadata: Metadata = { title: "ویرایش دسته‌بندی | پنل مدیریت" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categories = await getAllCategories();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">ویرایش دسته‌بندی</h1>
      <CategoryForm category={category} />
    </div>
  );
}
