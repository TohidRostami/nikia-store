"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SingleImageUploader } from "@/components/admin/single-image-uploader";
import type { CategoryDTO } from "@/lib/types";
import {
  createCategory,
  updateCategory,
  uploadCategoryImage,
  type CategoryFormInput,
} from "@/app/admin/categories/actions";
import { slugify } from "@/lib/slug";

// function slugify(value: string) {
//   return value
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9\s-]/g, "")
//     .replace(/\s+/g, "-")
//     .replace(/-+/g, "-");
// }

export function CategoryForm({ category }: { category?: CategoryDTO }) {
  const router = useRouter();
  const isEdit = !!category;

  const [title, setTitle] = useState(category?.title ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState<string | null>(category?.image ?? null);
  const [sortOrder, setSortOrder] = useState(category?.sortOrder?.toString() ?? "0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      const generated = slugify(value);
      setSlug(/[a-z0-9]/.test(generated) ? generated : "");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const input: CategoryFormInput = {
      title,
      slug,
      description,
      image,
      sortOrder: Number(sortOrder) || 0,
    };

    const result = isEdit ? await updateCategory(category.id, input) : await createCategory(input);
    setLoading(false);

    if ("error" in result) {
      setError(result.error ?? "خطایی رخ داد.");
      return;
    }
    toast.success(isEdit ? "دسته‌بندی به‌روزرسانی شد" : "دسته‌بندی ساخته شد");
    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6 sm:flex-row">
      <div className="flex flex-1 flex-col gap-5 rounded-lg border border-border p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">عنوان</Label>
          <Input id="title" required value={title} onChange={(e) => handleTitleChange(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">اسلاگ</Label>
          <Input
            id="slug"
            dir="ltr"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">توضیح کوتاه</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sortOrder">ترتیب نمایش</Label>
          <Input
            id="sortOrder"
            type="number"
            dir="ltr"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="text-end w-28 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button size="sm" type="submit" disabled={loading}>
            {loading ? "در حال ذخیره..." : isEdit ? "ذخیره تغییرات" : "ساخت دسته‌بندی"}
          </Button>
          <Button size="sm" type="button" variant="outline" onClick={() => router.back()}>
            انصراف
          </Button>
        </div>
      </div>

      <div className="flex w-full flex-col gap-1.5 sm:w-56">
        <Label>تصویر دسته‌بندی</Label>
        <SingleImageUploader value={image} onChange={setImage} uploadAction={uploadCategoryImage} />
        <p className="text-xs text-muted-foreground">
          اگر عکسی تنظیم نشود، به‌جای آن نماد ساده‌ی این دسته‌بندی نمایش داده می‌شود.
        </p>
      </div>
    </form>
  );
}
