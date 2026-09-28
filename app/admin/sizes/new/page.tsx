import type { Metadata } from "next";
import { SizeForm } from "@/components/admin/size-form";

export const metadata: Metadata = { title: "سایز جدید | پنل مدیریت" };

export default function NewSizePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">سایز جدید</h1>
      <SizeForm />
    </div>
  );
}
