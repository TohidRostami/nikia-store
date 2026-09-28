"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/app/(shop)/actions";
import { cn } from "@/lib/utils";

/** Email-or-mobile sign-up. `tone="dark"` is for the footer, `"light"` for the home page band. */
export function NewsletterForm({
  placeholder,
  cta,
  tone = "light",
  className,
}: {
  placeholder: string;
  cta?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await subscribeNewsletter(value);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDone(true);
      setValue("");
      toast.success(result.message);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex overflow-hidden rounded-sm",
        tone === "dark" ? "bg-paper" : "border border-line bg-white",
        className,
      )}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="email"
        className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-[13px] text-ink outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        disabled={pending || !value.trim()}
        aria-label={cta ?? "عضویت"}
        className={cn(
          "flex items-center justify-center gap-2 px-4 text-sm text-ink transition-colors disabled:opacity-40",
          tone === "light" && "bg-ink text-paper hover:bg-ink/90",
        )}
      >
        {done ? <Check className="size-4" /> : cta ? cta : <ArrowLeft className="size-4" />}
      </button>
    </form>
  );
}
