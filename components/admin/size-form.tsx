"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SizeDTO } from "@/lib/types";
import { createSize, updateSize, type SizeFormInput } from "@/app/admin/sizes/actions";

export function SizeForm({ size }: { size?: SizeDTO }) {
  const router = useRouter();
  const isEdit = !!size;

  const [name, setName] = useState(size?.name ?? "");
  const [description, setDescription] = useState(size?.description ?? "");
  const [sortOrder, setSortOrder] = useState(size?.sortOrder?.toString() ?? "0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const input: SizeFormInput = { name, description, sortOrder: Number(sortOrder) || 0 };
    const result = isEdit ? await updateSize(size.id, input) : await createSize(input);
    setLoading(false);

    if ("error" in result) {
      setError(result.error ?? "خطایی رخ داد.");
      return;
    }
    toast.success(isEdit ? "سایز به‌روزرسانی شد" : "سایز ساخته شد");
    router.push("/admin/sizes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5 rounded-lg border border-border p-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">نام سایز</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثلاً M یا 42 یا XL"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">توضیح / ابعاد (اختیاری)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="مثلاً دور سینه ۹۲ تا ۹۸ سانتی‌متر"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sortOrder">ترتیب نمایش</Label>
        <Input
          id="sortOrder"
          type="number"
          dir="ltr"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="text-end w-28 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "در حال ذخیره..." : isEdit ? "ذخیره تغییرات" : "ساخت سایز"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
