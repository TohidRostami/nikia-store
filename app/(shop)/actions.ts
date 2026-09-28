"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { normalizeContact } from "@/lib/audience";
import { isIranMobile, normalizeIranPhone, phoneToLocal } from "@/lib/format";
import { normalizeFa } from "@/lib/search";
import { searchProducts } from "@/lib/queries/products";
import { siteConfig } from "@/lib/content";
import type { ProductDTO } from "@/lib/types";

export async function searchProductsAction(query: string): Promise<ProductDTO[]> {
  if (typeof query !== "string") return [];
  return searchProducts(query);
}

/* ─────────────────────────── newsletter ─────────────────────────── */

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

export async function subscribeNewsletter(input: string): Promise<ActionResult> {
  const contact = typeof input === "string" ? normalizeContact(input) : null;
  if (!contact) {
    return { ok: false, error: "ایمیل یا شماره موبایل معتبر وارد کنید." };
  }
  // Already subscribed is a success from the visitor's point of view.
  await prisma.newsletterSubscriber.upsert({
    where: { contact },
    update: {},
    create: { contact },
  });
  const code = siteConfig.home.newsletter.welcomeCode;
  return {
    ok: true,
    message: code
      ? `عضویت شما ثبت شد. کد تخفیف شما: ${code}`
      : "عضویت شما ثبت شد. ممنون که با ما هستید.",
  };
}

/* ───────────────────────── contact form ───────────────────────── */

const contactSchema = z.object({
  name: z.string().trim().min(2, "نام خود را وارد کنید.").max(80),
  phone: z.string().refine(isIranMobile, "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)."),
  subject: z.string().refine((s) => siteConfig.contactPage.subjects.includes(s), "موضوع را انتخاب کنید."),
  message: z.string().trim().min(5, "پیام خود را بنویسید.").max(2000, "پیام بیش از حد طولانی است."),
  // Honeypot — real visitors never see or fill this field.
  website: z.string().max(0).optional(),
});

export async function sendContactMessage(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است." };
  }
  const { name, phone, subject, message } = parsed.data;
  const normalizedPhone = phoneToLocal(normalizeIranPhone(phone));

  // Cheap spam guard: a few messages per number per hour, and an overall ceiling.
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [fromPhone, overall] = await Promise.all([
    prisma.contactMessage.count({ where: { phone: normalizedPhone, createdAt: { gt: since } } }),
    prisma.contactMessage.count({ where: { createdAt: { gt: since } } }),
  ]);
  if (fromPhone >= 5 || overall >= 200) {
    return { ok: false, error: "تعداد پیام‌ها زیاد بوده است؛ لطفاً کمی بعد دوباره تلاش کنید." };
  }

  await prisma.contactMessage.create({
    data: { name, phone: normalizedPhone, subject, message: normalizeFa(message) },
  });
  return { ok: true, message: "پیام شما دریافت شد." };
}

/* ───────────────────────────── wishlist ───────────────────────────── */

export async function getWishlistIds(): Promise<string[]> {
  const session = await getSession();
  if (!session) return [];
  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
    orderBy: { createdAt: "desc" },
  });
  return items.map((i) => i.productId);
}

export async function toggleWishlist(
  productId: string,
): Promise<{ ok: true; liked: boolean } | { ok: false; error: "auth" | "invalid" }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "auth" };
  if (typeof productId !== "string" || productId.length > 64) return { ok: false, error: "invalid" };

  const userId = session.user.id;
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { ok: true, liked: false };
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, isPublished: true, isArchived: false },
    select: { id: true },
  });
  if (!product) return { ok: false, error: "invalid" };

  await prisma.wishlistItem
    .create({ data: { userId, productId } })
    // A double-click can race the unique constraint — that still means "liked".
    .catch(() => undefined);
  return { ok: true, liked: true };
}
