import type { Metadata } from "next";
import { DiscountForm } from "@/components/admin/discount-form";

export const metadata: Metadata = { title: "کد تخفیف جدید | پنل مدیریت" };

export default function NewDiscountPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">کد تخفیف جدید</h1>
      <DiscountForm />
    </div>
  );
}
