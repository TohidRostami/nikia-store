"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setUserRole, type UserRole } from "@/app/admin/users/actions";

const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: "مشتری",
  SUBADMIN: "ساب‌ادمین",
  ADMIN: "ادمین",
};

export function RoleSelect({
  userId,
  role,
  isCurrentUser,
}: {
  userId: string;
  role: UserRole;
  isCurrentUser: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleChange(newRole: string) {
    if (newRole === role) return;
    setLoading(true);
    const result = await setUserRole(userId, newRole as UserRole);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("نقش کاربر به‌روزرسانی شد");
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={loading || isCurrentUser}>
      <SelectTrigger size="sm" className="mx-auto w-32" aria-label="نقش کاربر">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="CUSTOMER">{ROLE_LABELS.CUSTOMER}</SelectItem>
        <SelectItem value="SUBADMIN">{ROLE_LABELS.SUBADMIN}</SelectItem>
        <SelectItem value="ADMIN">{ROLE_LABELS.ADMIN}</SelectItem>
      </SelectContent>
    </Select>
  );
}
