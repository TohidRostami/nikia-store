import { prisma } from "@/lib/db";

export type HeroImageDTO = {
  id: string;
  url: string;
  isActive: boolean;
  sortOrder: number;
};

export async function getHeroImages(
  options: { activeOnly?: boolean } = {},
): Promise<HeroImageDTO[]> {
  const images = (await prisma.heroImage.findMany(
    options.activeOnly ? { where: { isActive: true } } : undefined,
  )) as unknown as HeroImageDTO[];
  return images.sort((a, b) => a.sortOrder - b.sortOrder);
}
