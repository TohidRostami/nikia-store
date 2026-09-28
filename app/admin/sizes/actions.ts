"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminOrSubAdmin } from "@/lib/require-admin";
import type { SizeDTO } from "@/lib/types";

export type SizeFormInput = {
  name: string;
  description: string;
  sortOrder: number;
};

function validate(input: SizeFormInput): string | null {
  if (!input.name.trim()) return "نام سایز را وارد کنید.";
  if (input.name.trim().length > 20)
    return "نام سایز باید کوتاه باشد (حداکثر ۲۰ کاراکتر).";
  return null;
}

export async function createSize(
  input: SizeFormInput,
): Promise<{ error: string } | { success: true; size: SizeDTO }> {
  await requireAdminOrSubAdmin();
  const error = validate(input);
  if (error) return { error };

  const trimmed = {
    ...input,
    name: input.name.trim(),
    description: input.description.trim() || null,
  };

  const existing = await prisma.size.findUnique({
    where: { name: trimmed.name },
  });
  if (existing) return { error: "سایزی با همین نام از قبل وجود دارد." };

  const size = await prisma.size.create({ data: trimmed });
  revalidatePath("/admin/sizes");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  return { success: true, size: size as unknown as SizeDTO };
}

export async function updateSize(id: string, input: SizeFormInput) {
  await requireAdminOrSubAdmin();
  const error = validate(input);
  if (error) return { error };

  await prisma.size.update({
    where: { id },
    data: {
      ...input,
      name: input.name.trim(),
      description: input.description.trim() || null,
    },
  });
  revalidatePath("/admin/sizes");
  revalidatePath("/admin/products");
  return { success: true as const };
}

export async function deleteSize(id: string) {
  await requireAdminOrSubAdmin();
  await prisma.size.delete({ where: { id } });
  revalidatePath("/admin/sizes");
  revalidatePath("/admin/products");
  return { success: true as const };
}
