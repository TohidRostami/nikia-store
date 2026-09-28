"use client";

import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronRight, ChevronLeft, CalendarDays, X } from "lucide-react";
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";

const MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
// Persian week starts on Saturday.
const WEEKDAYS_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toIsoDate(gy: number, gm: number, gd: number): string {
  return `${String(gy).padStart(4, "0")}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
}: {
  /** ISO date string ("YYYY-MM-DD", Gregorian) or "" — same shape a native <input type="date"> uses. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedDate = parseIsoDate(value);
  const selected = selectedDate ? toJalaali(selectedDate) : null;
  const today = toJalaali(new Date());

  const [viewYear, setViewYear] = useState(selected?.jy ?? today.jy);
  const [viewMonth, setViewMonth] = useState(selected?.jm ?? today.jm);

  function goPrevMonth() {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const daysInMonth = jalaaliMonthLength(viewYear, viewMonth);
  const firstDayGregorian = toGregorian(viewYear, viewMonth, 1);
  const firstDayDate = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
  const startOffset = (firstDayDate.getDay() + 1) % 7; // 0 = Saturday

  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function handleSelectDay(day: number) {
    const g = toGregorian(viewYear, viewMonth, day);
    onChange(toIsoDate(g.gy, g.gm, g.gd));
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      // Re-center the visible month on the current selection every time
      // it's reopened, rather than wherever it was last left.
      setViewYear(selected?.jy ?? today.jy);
      setViewMonth(selected?.jm ?? today.jm);
    }
    setOpen(next);
  }

  const displayLabel = selected
    ? `${toPersianDigits(selected.jd)} ${MONTHS_FA[selected.jm - 1]} ${toPersianDigits(selected.jy)}`
    : placeholder;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3.5 text-sm outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
            !selected && "text-muted-foreground"
          )}
        >
          <span>{displayLabel}</span>
          <span className="flex shrink-0 items-center gap-1">
            {selected && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                aria-label="پاک‌کردن تاریخ"
                className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </span>
            )}
            <CalendarDays className="size-4 text-muted-foreground" />
          </span>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-50 w-72 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md"
        >
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="ماه قبل"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="text-sm font-medium">
              {MONTHS_FA[viewMonth - 1]} {toPersianDigits(viewYear)}
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="ماه بعد"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 pb-1">
            {WEEKDAYS_FA.map((d, i) => (
              <span key={i} className="flex h-6 items-center justify-center text-[11px] text-muted-foreground">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <span key={`empty-${i}`} />;
              const isSelected =
                !!selected && selected.jy === viewYear && selected.jm === viewMonth && selected.jd === day;
              const isToday = today.jy === viewYear && today.jm === viewMonth && today.jd === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md text-sm transition-colors",
                    isSelected
                      ? "bg-foreground text-background"
                      : isToday
                        ? "border border-accent-2 text-foreground"
                        : "text-foreground hover:bg-secondary"
                  )}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
