"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { deleteFromArvan, keyFromUrl } from "@/lib/storage";
import { processAndUploadImage, type UploadOutcome } from "@/lib/image-upload";

export type SettingsInput = {
  emailLoginEnabled: boolean;
  smsLoginEnabled: boolean;
  standardShippingCost: number;
  freeShippingThreshold: number | null;
  heroImages: { url: string; isActive: boolean }[];
};

export async function updateSiteSettings(input: SettingsInput) {
  await requireAdmin();

  if (!input.emailLoginEnabled && !input.smsLoginEnabled) {
    return { error: "حداقل یکی از روش‌های ورود (ایمیل یا پیامک) باید فعال بماند." };
  }

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    update: {
      emailLoginEnabled: input.emailLoginEnabled,
      smsLoginEnabled: input.smsLoginEnabled,
      standardShippingCost: input.standardShippingCost,
      freeShippingThreshold: input.freeShippingThreshold,
    },
    create: {
      id: "singleton",
      emailLoginEnabled: input.emailLoginEnabled,
      smsLoginEnabled: input.smsLoginEnabled,
      standardShippingCost: input.standardShippingCost,
      freeShippingThreshold: input.freeShippingThreshold,
    },
  });

  // Sync hero images the same way product images are synced: delete
  // whatever's no longer in the list (including from Object Storage),
  // then recreate rows in the submitted order, with each one's isActive.
  const existingImages = (await prisma.heroImage.findMany({})) as { url: string }[];
  const keep = new Set(input.heroImages.map((i) => i.url));
  for (const img of existingImages) {
    if (!keep.has(img.url)) {
      const key = keyFromUrl(img.url);
      if (key) await deleteFromArvan(key).catch(() => {});
    }
  }
  await prisma.heroImage.deleteMany({});
  for (const [i, image] of input.heroImages.entries()) {
    await prisma.heroImage.create({
      data: { url: image.url, isActive: image.isActive, sortOrder: i },
    });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/login");
  revalidatePath("/register");
  revalidatePath("/");
  return { success: true as const };
}

export async function uploadHeroImage(formData: FormData): Promise<UploadOutcome> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "فایلی انتخاب نشده است." };
  return processAndUploadImage(file, "hero", 2400);
}
