"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { updateProfile } from "@/app/(shop)/account/actions";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const input =
  "h-12 w-full rounded-sm border border-line bg-white px-3.5 text-sm outline-none transition-colors focus:border-ink read-only:bg-sand";

export function ProfileForm({
  initial,
  sizes,
}: {
  initial: { name: string; email: string; phone: string; phoneLocked: boolean; birthDate: string; usualSize: string };
  sizes: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone,
        birthDate: form.birthDate,
        usualSize: form.usualSize,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("اطلاعات شما ذخیره شد");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid max-w-[720px] gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <label className="flex flex-col gap-2 text-[13px]">
          نام و نام خانوادگی
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" className={input} />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          شماره موبایل
          <input
            value={form.phoneLocked ? toPersianDigits(form.phone) : form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            readOnly={form.phoneLocked}
            dir="ltr"
            inputMode="numeric"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            className={cn(input, "text-right")}
          />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          ایمیل
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" autoComplete="email" placeholder="you@example.com" className={cn(input, "text-right")} />
        </label>
        <div className="flex flex-col gap-2 text-[13px]">
          <span>تاریخ تولد</span>
          <JalaliDatePicker value={form.birthDate} onChange={(v) => setForm({ ...form, birthDate: v })} placeholder="انتخاب تاریخ" />
        </div>
        <label className="flex flex-col gap-2 text-[13px]">
          سایز معمول
          <select value={form.usualSize} onChange={(e) => setForm({ ...form, usualSize: e.target.value })} className={input}>
            <option value="">— انتخاب نشده —</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {toPersianDigits(s)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-sale">{error}</p>}
      <button type="submit" disabled={pending} className="self-start rounded-sm bg-ink px-8 py-3.5 text-sm text-paper transition-colors hover:bg-ink/90 disabled:opacity-50">
        {pending ? "در حال ذخیره…" : "ذخیره تغییرات"}
      </button>
    </form>
  );
}
