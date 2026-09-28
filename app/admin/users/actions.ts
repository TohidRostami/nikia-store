"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";

export type UserRole = "ADMIN" | "SUBADMIN" | "CUSTOMER";

export async function setUserRole(userId: string, role: UserRole) {
  const session = await requireAdmin();

  // Broadened from the original "can't demote self to CUSTOMER" check —
  // demoting yourself to SUBADMIN would just as surely lock you out of
  // the admin-only sections (orders, discounts, users, settings).
  if (session.user.id === userId && role !== "ADMIN") {
    return { error: "نمی‌توانید نقش خودتان را تغییر دهید." };
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return { success: true as const };
}
