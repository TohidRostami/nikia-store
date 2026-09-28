import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "دسته‌بندی جدید | پنل مدیریت" };

export default function NewCategoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">دسته‌بندی جدید</h1>
      <CategoryForm />
    </div>
  );
}
