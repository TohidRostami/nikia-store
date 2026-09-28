import { prisma } from "@/lib/db";
import type { SizeDTO } from "@/lib/types";

export async function getAllSizes(): Promise<SizeDTO[]> {
  const sizes = await prisma.size.findMany({ orderBy: { sortOrder: "asc" } });
  return sizes as unknown as SizeDTO[];
}
