"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";

export async function setMessageRead(id: string, isRead: boolean) {
  await requireAdmin();
  await prisma.contactMessage.updateMany({ where: { id }, data: { isRead } });
  revalidatePath("/admin/messages");
  return { success: true as const };
}

export async function deleteMessage(id: string) {
  await requireAdmin();
  await prisma.contactMessage.deleteMany({ where: { id } });
  revalidatePath("/admin/messages");
  return { success: true as const };
}
