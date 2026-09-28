import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";

// Sign-in pages read the session and site settings on every request.
export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-wrap">{children}</main>
    </div>
  );
}
