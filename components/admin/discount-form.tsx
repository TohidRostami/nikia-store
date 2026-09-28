"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import type { DiscountCodeRow } from "@/lib/queries/admin-discounts";
import {
  createDiscountCode,
  updateDiscountCode,
  type DiscountFormInput,
} from "@/app/admin/discounts/actions";

export function DiscountForm({ discount }: { discount?: DiscountCodeRow }) {
  const router = useRouter();
  const isEdit = !!discount;

  const [code, setCode] = useState(discount?.code ?? "");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">(
    discount?.type ?? "PERCENTAGE",
  );
  const [value, setValue] = useState(discount?.value?.toString() ?? "");
  const [maxUses, setMaxUses] = useState(discount?.maxUses?.toString() ?? "");
  const [minOrderTotal, setMinOrderTotal] = useState(
    discount?.minOrderTotal?.toString() ?? "",
  );
  const [expiresAt, setExpiresAt] = useState(
    discount?.expiresAt
      ? new Date(discount.expiresAt).toISOString().slice(0, 10)
      : "",
  );
  const [isActive, setIsActive] = useState(discount?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const input: DiscountFormInput = {
      code: code.toUpperCase(),
      type,
      value: Number(value),
      maxUses: maxUses ? Number(maxUses) : null,
      minOrderTotal: minOrderTotal ? Number(minOrderTotal) : null,
      expiresAt: expiresAt || null,
      isActive,
    };

    const result = isEdit
      ? await updateDiscountCode(discount.id, input)
      : await createDiscountCode(input);
    setLoading(false);

    if ("error" in result) {
      setError(result.error ?? "خطایی رخ داد.");
      return;
    }
    toast.success(isEdit ? "کد تخفیف به‌روزرسانی شد" : "کد تخفیف ساخته شد");
    router.push("/admin/discounts");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-w-lg flex-col gap-5 rounded-lg border border-border p-6"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">کد تخفیف</Label>
        <Input
          id="code"
          dir="ltr"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="NIKIA10"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="type">نوع تخفیف</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED")}
            className="h-11 rounded-md border border-input bg-background px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="PERCENTAGE">درصدی</option>
            <option value="FIXED">مبلغ ثابت (تومان)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="value">مقدار</Label>
          <Input
            id="value"
            type="number"
            dir="ltr"
            required
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="text-end appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maxUses">حداکثر تعداد استفاده (اختیاری)</Label>
          <Input
            id="maxUses"
            type="number"
            dir="ltr"
            min={0}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="text-end appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="minOrderTotal">حداقل مبلغ سفارش (اختیاری)</Label>
          <Input
            id="minOrderTotal"
            type="number"
            dir="ltr"
            min={0}
            value={minOrderTotal}
            onChange={(e) => setMinOrderTotal(e.target.value)}
            className="text-end appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expiresAt">تاریخ انقضا (اختیاری)</Label>
        <JalaliDatePicker value={expiresAt} onChange={setExpiresAt} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">فعال</p>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? "در حال ذخیره..."
            : isEdit
              ? "ذخیره تغییرات"
              : "ساخت کد تخفیف"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
