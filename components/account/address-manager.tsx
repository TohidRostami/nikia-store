"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/app/(shop)/account/actions";
import { IRAN_PROVINCES } from "@/lib/address";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export type AddressItem = {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  postalCode: string;
  addressLine: string;
  isDefault: boolean;
};

const EMPTY = { fullName: "", phone: "", province: "تهران", city: "", postalCode: "", addressLine: "", isDefault: false };
const input =
  "h-12 w-full rounded-sm border border-line bg-white px-3.5 text-sm outline-none transition-colors focus:border-ink";

export function AddressManager({ addresses, defaultName }: { addresses: AddressItem[]; defaultName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY, fullName: defaultName, isDefault: addresses.length === 0 });
    setError(null);
    setOpen(true);
  }

  function openEdit(a: AddressItem) {
    setEditing(a.id);
    setForm({ fullName: a.fullName, phone: a.phone, province: a.province, city: a.city, postalCode: a.postalCode, addressLine: a.addressLine, isDefault: a.isDefault });
    setError(null);
    setOpen(true);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveAddress(editing, form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("آدرس ذخیره شد");
      setOpen(false);
      router.refresh();
    });
  }

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.error(result.error);
      else {
        toast.success(success);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {addresses.map((a) => (
          <div
            key={a.id}
            className={cn(
              "flex flex-col gap-2.5 rounded-lg bg-white p-5 text-[13px] leading-[2]",
              a.isDefault ? "border-[1.5px] border-ink" : "border border-[#e2dace]",
            )}
          >
            <div className="flex items-center justify-between">
              <b className="text-sm font-semibold">{a.fullName}</b>
              {a.isDefault && <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] text-paper">پیش‌فرض</span>}
            </div>
            <span className="text-body">
              {a.province}، {a.city}، {a.addressLine}
            </span>
            <span className="text-muted-foreground">
              کد پستی {toPersianDigits(a.postalCode)} · <span className="font-nums">{toPersianDigits(a.phone)}</span>
            </span>
            <div className="mt-1 flex flex-wrap gap-4 text-xs">
              <button type="button" onClick={() => openEdit(a)} className="underline">
                ویرایش
              </button>
              {!a.isDefault && (
                <button type="button" disabled={pending} onClick={() => run(() => setDefaultAddress(a.id), "آدرس پیش‌فرض تغییر کرد")} className="underline">
                  پیش‌فرض کن
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm("این آدرس حذف شود؟")) run(() => deleteAddress(a.id), "آدرس حذف شد");
                }}
                className="text-sale underline"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={openNew}
          className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#b3a898] p-5 text-sm text-body transition-colors hover:border-ink hover:text-ink"
        >
          <Plus className="size-5" strokeWidth={1.5} />
          افزودن آدرس جدید
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="overflow-y-auto p-6">
          <SheetTitle>{editing ? "ویرایش آدرس" : "آدرس جدید"}</SheetTitle>
          <SheetDescription className="sr-only">اطلاعات گیرنده و آدرس تحویل</SheetDescription>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="نام و نام خانوادگی گیرنده">
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={input} />
            </Field>
            <Field label="شماره موبایل">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" inputMode="numeric" placeholder="۰۹۱۲۳۴۵۶۷۸۹" className={cn(input, "text-right")} />
            </Field>
            <Field label="استان">
              <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className={input}>
                {IRAN_PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="شهر">
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input} />
            </Field>
            <Field label="آدرس کامل">
              <textarea rows={3} value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} className="w-full resize-y rounded-sm border border-line bg-white px-3.5 py-3 text-sm leading-[1.9] outline-none focus:border-ink" />
            </Field>
            <Field label="کد پستی (۱۰ رقم)">
              <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} dir="ltr" inputMode="numeric" className={cn(input, "text-right")} />
            </Field>
            <label className="flex items-center gap-2.5 text-[13px]">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-ink" />
              آدرس پیش‌فرض من باشد
            </label>
            {error && <p role="alert" className="text-sm text-sale">{error}</p>}
            <button type="submit" disabled={pending} className="h-12 rounded-sm bg-ink text-sm text-paper transition-colors hover:bg-ink/90 disabled:opacity-50">
              {pending ? "در حال ذخیره…" : "ذخیره آدرس"}
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-[13px]">
      {label}
      {children}
    </label>
  );
}
