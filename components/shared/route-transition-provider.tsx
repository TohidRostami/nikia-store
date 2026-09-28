"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type RouteTransitionContextValue = {
  /** true از لحظه‌ای که push/replace صدا زده می‌شه تا وقتی صفحه‌ی جدید کامل رندر بشه. */
  isPending: boolean;
  /** جایگزین router.push — همون کار رو می‌کنه ولی isPending رو مدیریت می‌کنه. */
  push: (href: string) => void;
  /** جایگزین router.replace — برای فیلتر/صفحه‌بندی که نمی‌خوایم تاریخچه پر بشه. */
  replace: (href: string) => void;
};

const RouteTransitionContext =
  createContext<RouteTransitionContextValue | null>(null);

/**
 * یک بار توی app/layout.tsx (یا هر layout ریشه‌ای دیگه) دور کل اپ بذار.
 * بعدش هر کامپوننتی که فیلتر/صفحه‌بندی/سورت رو با تغییر URL پیاده می‌کنه،
 * به‌جای useRouter() مستقیم، از useRouteTransition() استفاده کنه.
 */
export function RouteTransitionProvider({
  children,
  barClassName = "bg-foreground",
}: {
  children: ReactNode;
  /** رنگ نوار بالای صفحه — با کلاس Tailwind خودت (مثلاً "bg-brand") عوضش کن. */
  barClassName?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const push = (href: string) => startTransition(() => router.push(href));
  const replace = (href: string) => startTransition(() => router.replace(href));

  return (
    <RouteTransitionContext.Provider value={{ isPending, push, replace }}>
      {children}
      <TopProgressBar show={isPending} barClassName={barClassName} />
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  const ctx = useContext(RouteTransitionContext);
  if (!ctx) {
    throw new Error(
      "useRouteTransition باید داخل <RouteTransitionProvider> استفاده بشه.",
    );
  }
  return ctx;
}

function TopProgressBar({
  show,
  barClassName,
}: {
  show: boolean;
  barClassName: string;
}) {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden bg-black/5">
      <div className={`h-full w-1/3 animate-route-bar ${barClassName}`} />
      <style>{`
        @keyframes route-bar-slide {
          0% { margin-inline-start: -34%; }
          50% { margin-inline-start: 50%; }
          100% { margin-inline-start: 100%; }
        }
        .animate-route-bar { animation: route-bar-slide 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
