import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SizeForm } from "@/components/admin/size-form";
import { getAllSizes } from "@/lib/queries/admin-sizes";

export const metadata: Metadata = { title: "ویرایش سایز | پنل مدیریت" };

export default async function EditSizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sizes = await getAllSizes();
  const size = sizes.find((s) => s.id === id);
  if (!size) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">ویرایش سایز</h1>
      <SizeForm size={size} />
    </div>
  );
}
