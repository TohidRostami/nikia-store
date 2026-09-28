"use client";

import { useRouteTransition } from "@/components/shared/route-transition-provider";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { cn } from "@/lib/utils";

/**
 * دور هر محتوای سرور-رندرشده (جدول، گرید، لیست) که با تغییر URL آپدیت
 * می‌شه بذار — نیازی نیست خودِ اون محتوا client component باشه.
 *
 * مثال:
 *   <TransitionRegion>
 *     <Table>...</Table>   ← همون چیزی که سرور رندر کرده
 *   </TransitionRegion>
 */
export function TransitionRegion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isPending } = useRouteTransition();

  return (
    <div className={cn("relative", className)}>
      {children}
      <LoadingOverlay show={isPending} />
    </div>
  );
}
