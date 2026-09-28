import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/require-admin";
import { getSiteSettings } from "@/lib/queries/settings";
import { getHeroImages } from "@/lib/queries/hero-images";

export const metadata: Metadata = { title: "تنظیمات | پنل مدیریت" };

export default async function AdminSettingsPage() {
  // Settings is ADMIN-only — see the same note in orders/page.tsx.
  await requireAdmin();
  const [settings, heroImages] = await Promise.all([
    getSiteSettings(),
    getHeroImages(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">تنظیمات</h1>
      <SettingsForm settings={settings} heroImages={heroImages} />
    </div>
  );
}
