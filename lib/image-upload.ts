import { convertToWebp } from "@/lib/image";
import { uploadToArvan, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/storage";

export type UploadOutcome = { error: string } | { success: true; url: string };

/**
 * Shared pipeline behind every admin image uploader (products, categories,
 * hero). Every image — whatever format it's uploaded as — is converted to
 * WebP before it ever reaches Object Storage.
 */
export async function processAndUploadImage(
  file: File,
  folder: "products" | "categories" | "hero",
  maxDimension?: number
): Promise<UploadOutcome> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: "فرمت فایل باید JPG، PNG، WebP یا AVIF باشد." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "حجم فایل نباید بیشتر از ۵ مگابایت باشد." };
  }

  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());

    let webpBuffer: Buffer;
    try {
      webpBuffer = await convertToWebp(inputBuffer, { maxDimension });
    } catch {
      return { error: "فایل تصویر خراب است یا پردازش آن ممکن نیست. لطفاً فایل دیگری امتحان کنید." };
    }

    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const { url } = await uploadToArvan(webpBuffer, key, "image/webp");
    return { success: true, url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "خطا در آپلود تصویر." };
  }
}
