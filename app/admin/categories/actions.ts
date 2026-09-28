"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminOrSubAdmin } from "@/lib/require-admin";
import { deleteFromArvan, keyFromUrl } from "@/lib/storage";
import { processAndUploadImage, type UploadOutcome } from "@/lib/image-upload";

export type CategoryFormInput = {
  title: string;
  slug: string;
  description: string;
  image: string | null;
  sortOrder: number;
};

function validate(input: CategoryFormInput): string | null {
  if (!input.title.trim()) return "عنوان دسته‌بندی را وارد کنید.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug)) {
    return "اسلاگ فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و خط‌تیره باشد.";
  }
  return null;
}

export async function createCategory(input: CategoryFormInput) {
  await requireAdminOrSubAdmin();
  const error = validate(input);
  if (error) return { error };

  await prisma.category.create({ data: input });
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true as const };
}

export async function updateCategory(id: string, input: CategoryFormInput) {
  await requireAdminOrSubAdmin();
  const error = validate(input);
  if (error) return { error };

  const existing = (await prisma.category.findUnique({ where: { id } })) as {
    image: string | null;
  } | null;
  if (existing?.image && existing.image !== input.image) {
    const key = keyFromUrl(existing.image);
    if (key) await deleteFromArvan(key).catch(() => {});
  }

  await prisma.category.update({ where: { id }, data: input });
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true as const };
}

export async function deleteCategory(id: string) {
  await requireAdminOrSubAdmin();
  const existing = (await prisma.category.findUnique({ where: { id } })) as {
    image: string | null;
  } | null;
  if (existing?.image) {
    const key = keyFromUrl(existing.image);
    if (key) await deleteFromArvan(key).catch(() => {});
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return { success: true as const };
}

export async function uploadCategoryImage(
  formData: FormData,
): Promise<UploadOutcome> {
  await requireAdminOrSubAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "فایلی انتخاب نشده است." };
  return processAndUploadImage(file, "categories");
}
