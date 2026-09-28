import type { Metadata } from "next";
import { requireAdminOrSubAdmin } from "@/lib/require-admin";
import { PosForm } from "@/components/admin/pos-form";

export const metadata: Metadata = { title: "خرید حضوری | پنل مدیریت" };

export default async function AdminPosPage() {
  await requireAdminOrSubAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">خرید حضوری</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ثبت فروش انجام‌شده در فروشگاه — بدون نیاز به درگاه پرداخت.
        </p>
      </div>

      <PosForm />
    </div>
  );
}
