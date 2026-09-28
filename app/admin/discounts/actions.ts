"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";

export type DiscountFormInput = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxUses: number | null;
  minOrderTotal: number | null;
  expiresAt: string | null;
  isActive: boolean;
};

function validate(input: DiscountFormInput): string | null {
  if (!/^[A-Z0-9]+$/.test(input.code)) return "کد فقط می‌تواند شامل حروف بزرگ انگلیسی و عدد باشد.";
  if (!input.value || input.value <= 0) return "مقدار تخفیف باید بزرگ‌تر از صفر باشد.";
  if (input.type === "PERCENTAGE" && input.value > 100) return "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.";
  return null;
}

export async function createDiscountCode(input: DiscountFormInput) {
  await requireAdmin();
  const error = validate(input);
  if (error) return { error };

  await prisma.discountCode.create({
    data: { ...input, usedCount: 0, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null },
  });
  revalidatePath("/admin/discounts");
  return { success: true as const };
}

export async function updateDiscountCode(id: string, input: DiscountFormInput) {
  await requireAdmin();
  const error = validate(input);
  if (error) return { error };

  await prisma.discountCode.update({
    where: { id },
    data: { ...input, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null },
  });
  revalidatePath("/admin/discounts");
  return { success: true as const };
}

export async function deleteDiscountCode(id: string) {
  await requireAdmin();
  await prisma.discountCode.delete({ where: { id } });
  revalidatePath("/admin/discounts");
  return { success: true as const };
}
