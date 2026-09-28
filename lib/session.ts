import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** The current session, or null. Safe to call from any server component or action. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * For pages that need a signed-in customer. Sends visitors to /login and
 * brings them back to `returnTo` afterwards.
 */
export async function requireUser(returnTo: string) {
  const session = await getSession();
  if (!session) redirect(`/login?redirect=${encodeURIComponent(returnTo)}`);
  return session;
}

/** Only allow same-site relative redirects — never an attacker-supplied URL. */
export function safeRedirectPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
