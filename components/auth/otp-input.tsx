"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { toLatinDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One box per digit, LTR, with auto-advance, backspace and paste support. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  invalid,
  onComplete,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  invalid?: boolean;
  onComplete?: (code: string) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function commit(next: string) {
    const clean = toLatinDigits(next).replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      commit(value.slice(0, i - 1));
      refs.current[i - 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = toLatinDigits(e.clipboardData.getData("text")).replace(/\D/g, "").slice(0, length);
    commit(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div dir="ltr" className="flex justify-center gap-2.5">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={2}
          aria-label={`رقم ${i + 1}`}
          aria-invalid={invalid}
          onChange={(e) => {
            const typed = toLatinDigits(e.target.value).replace(/\D/g, "");
            if (!typed) {
              commit(value.slice(0, i));
              return;
            }
            const next = (value.slice(0, i) + typed).slice(0, length);
            commit(next);
            refs.current[Math.min(next.length, length - 1)]?.focus();
          }}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-[60px] w-11 rounded-md border bg-white text-center text-[22px] outline-none transition-colors focus:border-ink sm:w-12",
            invalid ? "border-sale" : "border-line",
          )}
        />
      ))}
    </div>
  );
}
