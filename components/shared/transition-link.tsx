"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useRouteTransition } from "@/components/shared/route-transition-provider";

/**
 * دقیقاً مثل next/link رفتار می‌کنه (prefetch، باز شدن در تب جدید با
 * Ctrl/Cmd/میانی‌کلیک) با یک تفاوت: کلیک معمولی به‌جای navigation پیش‌فرض
 * Next.js، از مسیر useRouteTransition().push می‌ره — یعنی isPending درست ست
 * می‌شه و هر <TransitionRegion>/نوار بالای صفحه که به اون گوش می‌ده، لودینگ
 * نشون می‌ده.
 *
 * برای هر جای دیگه‌ی سایت که یک <Link> باید لودینگ رو تریگر کنه (پجینیشن،
 * تب‌های فیلتر، لینک‌های ناوبری در جدول و ...) به‌جای next/link همینو ایمپورت
 * کن.
 */
export function TransitionLink({
  href,
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  const { push } = useRouteTransition();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    // کلیک‌های میانی/Ctrl/Cmd/Shift باید طبق رفتار عادی مرورگر در تب جدید باز بشن
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;

    e.preventDefault();
    push(typeof href === "string" ? href : href.toString());
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
