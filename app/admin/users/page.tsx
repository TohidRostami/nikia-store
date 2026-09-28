import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { RoleSelect } from "@/components/admin/role-select";
import { requireAdmin } from "@/lib/require-admin";
import { getAllUsers } from "@/lib/queries/admin-users";
import { formatJalali } from "@/lib/date";

export const metadata: Metadata = { title: "کاربران | پنل مدیریت" };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "ادمین",
  SUBADMIN: "ساب‌ادمین",
  CUSTOMER: "مشتری",
};

const ROLE_BADGE_VARIANT: Record<string, "accent" | "outline" | "default"> = {
  ADMIN: "accent",
  SUBADMIN: "default",
  CUSTOMER: "outline",
};

export default async function AdminUsersPage() {
  // Users management is ADMIN-only. The layout now also lets subAdmin
  // into /admin/* in general, so this page re-checks the stricter rule
  // itself rather than relying only on the layout never changing.
  const session = await requireAdmin();
  const users = await getAllUsers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">کاربران</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="">{users.length}</span> کاربر
        </p>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-center">نام</TableHead>
              <TableHead className="text-center">ایمیل / موبایل</TableHead>
              <TableHead className="text-center">نقش</TableHead>
              <TableHead className="text-center">تاریخ عضویت</TableHead>
              <TableHead className="text-center">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isPlaceholderEmail = u.email.endsWith(
                "@phone.nikia.local",
              );
              return (
                <TableRow key={u.id}>
                  <TableCell className="text-center font-medium">
                    {u.name}
                  </TableCell>
                  <TableCell
                    className="text-center  text-muted-foreground"
                    dir="ltr"
                  >
                    {isPlaceholderEmail ? (u.phoneNumber ?? "—") : u.email}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={ROLE_BADGE_VARIANT[u.role] ?? "outline"}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {formatJalali(u.createdAt)}
                  </TableCell>
                  <TableCell className="pe-6 text-center">
                    <RoleSelect
                      userId={u.id}
                      role={u.role as "ADMIN" | "SUBADMIN" | "CUSTOMER"}
                      isCurrentUser={u.id === session.user.id}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
