import type { ReactNode } from "react";
import { requireAdminOrSubAdmin } from "@/lib/require-admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminMobileHeader } from "@/components/admin/admin-mobile-header";
import { RouteTransitionProvider } from "@/components/shared/route-transition-provider";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdminOrSubAdmin();
  const role = (session.user as unknown as { role?: string }).role ?? "ADMIN";

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 bg-sidebar lg:sticky lg:top-0 lg:block lg:h-screen">
        <AdminNav role={role} />
      </aside>
      <div className="min-w-0 flex-1">
        <AdminMobileHeader role={role} />
        <main className="p-4 sm:p-6 lg:p-8">
          <RouteTransitionProvider>{children}</RouteTransitionProvider>
        </main>
      </div>
    </div>
  );
}
