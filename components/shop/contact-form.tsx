"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Check } from "lucide-react";
import { sendContactMessage } from "@/app/(shop)/actions";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-sm border border-line bg-paper px-3.5 text-sm outline-none transition-colors focus:border-ink";

export function ContactForm({
  subjects,
  sentTitle,
  sentText,
}: {
  subjects: string[];
  sentTitle: string;
  sentText: string;
}) {
  const [form, setForm] = useState({ name: "", phone: "", subject: subjects[0] ?? "", message: "", website: "" });
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendContactMessage(form);
      if (!result.ok) setError(result.error);
      else setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-ink text-paper">
          <Check className="size-6" />
        </span>
        <b className="text-lg font-medium">{sentTitle}</b>
        <span className="text-sm text-body">{sentText}</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h2 className="text-xl font-medium">ارسال پیام</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        <label className="flex flex-col gap-2 text-[13px]">
          نام شما
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" className={cn(field, "h-12")} />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          شماره موبایل
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="numeric" autoComplete="tel" dir="ltr" placeholder="۰۹۱۲۳۴۵۶۷۸۹" className={cn(field, "h-12 text-right")} />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-[13px]">
        موضوع
        <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={cn(field, "h-12")}>
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-[13px]">
        پیام
        <textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={cn(field, "resize-y py-3 leading-[1.9]")} />
      </label>
      {/* Honeypot: hidden from people, irresistible to bots. */}
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
        className="absolute -left-[9999px] size-0 opacity-0"
      />
      {error && <p role="alert" className="text-sm text-sale">{error}</p>}
      <button type="submit" disabled={pending} className="self-start rounded-sm bg-ink px-9 py-[15px] text-sm text-paper transition-colors hover:bg-ink/90 disabled:opacity-50">
        {pending ? "در حال ارسال…" : "ارسال پیام"}
      </button>
    </form>
  );
}
