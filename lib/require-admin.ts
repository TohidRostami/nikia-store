import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

async function getSessionOrRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?redirect=/admin");
  return session;
}

/**
 * Full admin only. Everything that was already using this — orders,
 * discounts, users, settings — keeps exactly the same protection with
 * no changes needed there, since this function's behavior didn't change.
 */
export async function requireAdmin() {
  const session = await getSessionOrRedirect();
  const role = (session.user as unknown as { role?: string }).role;
  if (role !== "ADMIN") redirect("/");
  return session;
}

/**
 * Admin or subAdmin — the relaxed gate for the smaller set of sections
 * subAdmin is allowed into: the admin layout itself, and the products,
 * categories, and sizes actions. Nothing else should ever use this.
 */
export async function requireAdminOrSubAdmin() {
  const session = await getSessionOrRedirect();
  const role = (session.user as unknown as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUBADMIN") redirect("/");
  return session;
}
