import { prisma } from "@/lib/db";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: "CUSTOMER" | "ADMIN" | "SUBADMIN";
  createdAt: string | Date;
};

export async function getAllUsers(): Promise<AdminUserRow[]> {
  // Newest first, sorted by the database. Capped: this page has no
  // pagination yet, and loading an unbounded user table would not scale.
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  }) as unknown as Promise<AdminUserRow[]>;
}
