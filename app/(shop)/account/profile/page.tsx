import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/profile-form";
import { prisma } from "@/lib/db";
import { phoneToLocal } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "اطلاعات حساب", robots: { index: false } };

export default async function ProfilePage() {
  const session = await requireUser("/account/profile");
  const [user, sizes] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.size.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true } }),
  ]);

  const numericName = /^[\d۰-۹+\s]+$/.test(user.name);
  return (
    <>
      <h1 className="text-[clamp(24px,3vw,32px)] font-normal">اطلاعات حساب</h1>
      <ProfileForm
        sizes={sizes.map((s) => s.name)}
        initial={{
          name: numericName ? "" : user.name,
          // Accounts created by phone carry a placeholder address — never show it.
          email: user.email.endsWith("@phone.nikia.local") ? "" : user.email,
          phone: user.phoneNumber ? phoneToLocal(user.phoneNumber) : "",
          phoneLocked: Boolean(user.phoneNumber),
          birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : "",
          usualSize: user.usualSize ?? "",
        }}
      />
    </>
  );
}
