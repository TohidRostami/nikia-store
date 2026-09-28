import sharp from "sharp";

/**
 * Converts any supported input image (JPEG/PNG/WebP/AVIF) to WebP.
 * Also caps the longest edge so admin uploads can't ship multi-megabyte
 * originals straight to storage — quality 82 is a good size/clarity
 * balance for product and hero photography.
 */
export async function convertToWebp(
  input: Buffer,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<Buffer> {
  const { maxDimension = 2000, quality = 82 } = options;

  return sharp(input)
    .rotate() // respect EXIF orientation before stripping metadata
    .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}
