import { prisma } from "@/lib/db";

export type DiscountCodeRow = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxUses: number | null;
  usedCount: number;
  minOrderTotal: number | null;
  expiresAt: string | Date | null;
  isActive: boolean;
};

export async function getAllDiscountCodes(): Promise<DiscountCodeRow[]> {
  const codes = await prisma.discountCode.findMany({});
  return codes as unknown as DiscountCodeRow[];
}
