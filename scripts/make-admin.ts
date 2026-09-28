/**
 * Promotes an existing account to ADMIN (or SUBADMIN):
 *
 *   npm run make-admin -- you@example.com
 *   npm run make-admin -- 09121234567
 *   npm run make-admin -- you@example.com --role=SUBADMIN
 *
 * Uses Turso when TURSO_DATABASE_URL is set, otherwise the local file.
 */
import "dotenv/config";
import { prisma } from "../lib/db";
import { normalizeIranPhone } from "../lib/format";

async function main() {
  const args = process.argv.slice(2);
  const identifier = args.find((a) => !a.startsWith("--"));
  const role =
    args.find((a) => a.startsWith("--role="))?.split("=")[1] ?? "ADMIN";

  if (!identifier || !["ADMIN", "SUBADMIN"].includes(role)) {
    console.error(
      "Usage: npm run make-admin -- <email|mobile> [--role=ADMIN|SUBADMIN]",
    );
    process.exit(1);
  }

  const isEmail = identifier.includes("@");
  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: identifier.trim().toLowerCase() }
      : { phoneNumber: normalizeIranPhone(identifier) },
  });

  if (!user) {
    console.error(
      `✗ No account found for "${identifier}". Register on the site first (/register or /login), then run this again.`,
    );
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: role as "ADMIN" | "SUBADMIN" },
  });
  console.log(`✓ ${user.name} (${identifier}) is now ${role}. Open /admin.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
