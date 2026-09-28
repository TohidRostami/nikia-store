"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * روی هر بخشی که در حال آپدیت‌شدنه (جدول، لیست، کارت‌ها) بذار — والدش باید
 * position: relative داشته باشه تا این overlay دقیقاً روش بشینه.
 *
 * مثال:
 *   <div className="relative">
 *     <LoadingOverlay show={isPending} />
 *     <Table>...</Table>
 *   </div>
 */
export function LoadingOverlay({
  show,
  className,
  label,
}: {
  show: boolean;
  className?: string;
  label?: string;
}) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-white/70 backdrop-blur-[1px] dark:bg-black/50",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
