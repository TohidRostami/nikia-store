import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function isConfigured(): boolean {
  return Boolean(
    process.env.ARVAN_ENDPOINT &&
    process.env.ARVAN_BUCKET &&
    process.env.ARVAN_ACCESS_KEY &&
    process.env.ARVAN_SECRET_KEY,
  );
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: "default", // ArvanCloud ignores AWS regions but the SDK requires a value
    endpoint: process.env.ARVAN_ENDPOINT,
    // ArvanCloud's own docs (docs.arvancloud.ir → Object Storage →
    // Credentials) explicitly call for path-style addressing
    // ({endpoint}/{bucket}/{key}), not the AWS SDK's virtual-hosted-style
    // default ({bucket}.{endpoint}/{key}). Without this, requests go to
    // a URL ArvanCloud doesn't route correctly, and the SDK — unable to
    // parse the resulting response — throws a generic "UnknownError"
    // instead of a real S3 error.
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.ARVAN_ACCESS_KEY ?? "",
      secretAccessKey: process.env.ARVAN_SECRET_KEY ?? "",
    },
  });
  return client;
}

/** Public URL for an object once uploaded with ACL: public-read. */
function publicUrl(key: string): string {
  const base = process.env.ARVAN_PUBLIC_URL_BASE;
  if (base) return `${base.replace(/\/$/, "")}/${key}`;

  // Path-style fallback: {endpoint}/{bucket}/{key} — matches the
  // forcePathStyle setting above and ArvanCloud's own recommended
  // addressing. Prefer ARVAN_PUBLIC_URL_BASE if you've set up a custom
  // domain or CDN in front of the bucket.
  const bucket = process.env.ARVAN_BUCKET ?? "";
  const endpoint = (process.env.ARVAN_ENDPOINT ?? "").replace(/\/$/, "");
  return `${endpoint}/${bucket}/${key}`;
}

export type UploadResult = { url: string; key: string };

/**
 * Uploads a file to ArvanCloud Object Storage (see README → "اتصال
 * Object Storage آروان‌کلاد" for setup). Throws a Persian, user-facing
 * error message if the required env vars aren't set yet.
 */
export async function uploadToArvan(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<UploadResult> {
  if (!isConfigured()) {
    throw new Error(
      "Object Storage آروان‌کلاد هنوز تنظیم نشده — متغیرهای ARVAN_ENDPOINT، ARVAN_BUCKET، ARVAN_ACCESS_KEY و ARVAN_SECRET_KEY را در .env قرار دهید (راهنما در README.md).",
    );
  }

  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.ARVAN_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );

  return { url: publicUrl(key), key };
}

export async function deleteFromArvan(key: string): Promise<void> {
  if (!isConfigured()) return;
  await getClient().send(
    new DeleteObjectCommand({ Bucket: process.env.ARVAN_BUCKET, Key: key }),
  );
}

/** Extracts the object key back out of a public URL, for deletes. */
export function keyFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    return pathname.replace(/^\//, "") || null;
  } catch {
    return null;
  }
}

export function isArvanConfigured(): boolean {
  return isConfigured();
}
