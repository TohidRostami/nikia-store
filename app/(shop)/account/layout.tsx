import type { ReactNode } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { getSession } from "@/lib/session";
import { phoneToLocal, toPersianDigits } from "@/lib/format";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  // Signed-out visitors: each page redirects to /login itself, so they come
  // back to the exact page they asked for.
  if (!session) return children;

  const user = session.user as typeof session.user & { phoneNumber?: string | null };
  const isPlaceholderEmail = user.email.endsWith("@phone.nikia.local");
  const subtitle = user.phoneNumber
    ? toPersianDigits(phoneToLocal(user.phoneNumber))
    : isPlaceholderEmail
      ? ""
      : user.email;
  const displayName = /^[\d۰-۹+\s]+$/.test(user.name) ? "مشتری نیکیا" : user.name;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-start gap-[clamp(24px,4vw,48px)] px-4 pt-[clamp(28px,4vw,48px)] sm:px-6 lg:px-10">
      <aside className="flex min-w-0 flex-[1_1_240px] flex-col gap-5 lg:max-w-[260px]">
        <div className="flex items-center gap-3.5">
          <span className="flex size-[52px] items-center justify-center rounded-full bg-[#e9e1d5] text-lg font-semibold">
            {displayName.charAt(0)}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <b className="truncate text-[15px] font-semibold">{displayName}</b>
            {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
          </div>
        </div>
        <AccountNav />
      </aside>
      <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-7">{children}</div>
    </div>
  );
}
