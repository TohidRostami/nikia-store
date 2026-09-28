"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { addressSchema } from "@/lib/address";
import { isIranMobile, normalizeIranPhone } from "@/lib/format";

type Result = { ok: true } | { ok: false; error: string };

const profileSchema = z.object({
  name: z.string().trim().min(2, "نام خود را وارد کنید.").max(80),
  email: z.string().trim().toLowerCase().email("ایمیل معتبر نیست.").max(120).or(z.literal("")),
  phone: z.string().refine((p) => p === "" || isIranMobile(p), "شماره موبایل معتبر نیست."),
  /** ISO date (yyyy-mm-dd) in the Gregorian calendar — the picker converts from Jalali. */
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  usualSize: z.string().max(10).or(z.literal("")),
});

export async function updateProfile(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "ابتدا وارد حساب کاربری شوید." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است." };
  const d = parsed.data;

  const birthDate = d.birthDate ? new Date(`${d.birthDate}T00:00:00.000Z`) : null;
  if (birthDate && (Number.isNaN(birthDate.getTime()) || birthDate > new Date())) {
    return { ok: false, error: "تاریخ تولد معتبر نیست." };
  }

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, phoneNumber: true },
  });
  const data: Record<string, unknown> = {
    name: d.name,
    birthDate,
    usualSize: d.usualSize || null,
  };
  if (d.email && d.email !== current?.email) {
    data.email = d.email;
    data.emailVerified = false;
  }
  // The phone number is the login identity for OTP users — only fill it if it's still empty.
  if (d.phone && !current?.phoneNumber) data.phoneNumber = normalizeIranPhone(d.phone);

  try {
    await prisma.user.update({ where: { id: session.user.id }, data });
  } catch {
    return { ok: false, error: "این ایمیل یا شماره قبلاً برای حساب دیگری ثبت شده است." };
  }
  revalidatePath("/account", "layout");
  return { ok: true };
}

export async function saveAddress(id: string | null, input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "ابتدا وارد حساب کاربری شوید." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "آدرس نامعتبر است." };
  const { isDefault, ...data } = parsed.data;
  const userId = session.user.id;

  await prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId } });
    const makeDefault = isDefault === true || count === 0;
    if (makeDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });

    if (id) {
      // Scoped by userId in the same query — can't touch someone else's address.
      await tx.address.updateMany({
        where: { id, userId },
        data: { ...data, ...(makeDefault ? { isDefault: true } : {}) },
      });
    } else {
      await tx.address.create({ data: { ...data, userId, isDefault: makeDefault } });
    }
  });
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "ابتدا وارد حساب کاربری شوید." };
  try {
    await prisma.address.deleteMany({ where: { id, userId: session.user.id } });
  } catch {
    // Past orders reference the address (onDelete: Restrict) — keep it for their history.
    return { ok: false, error: "این آدرس در سفارش‌های قبلی استفاده شده و قابل حذف نیست." };
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "ابتدا وارد حساب کاربری شوید." };
  const userId = session.user.id;
  await prisma.$transaction(async (tx) => {
    const mine = await tx.address.findFirst({ where: { id, userId }, select: { id: true } });
    if (!mine) return;
    await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    await tx.address.update({ where: { id }, data: { isDefault: true } });
  });
  revalidatePath("/account/addresses");
  return { ok: true };
}
