import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DiscountForm } from "@/components/admin/discount-form";
import { getAllDiscountCodes } from "@/lib/queries/admin-discounts";

export const metadata: Metadata = { title: "ویرایش کد تخفیف | پنل مدیریت" };

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const codes = await getAllDiscountCodes();
  const discount = codes.find((c) => c.id === id);
  if (!discount) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">ویرایش کد تخفیف</h1>
      <DiscountForm discount={discount} />
    </div>
  );
}
