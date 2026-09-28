import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/content";
import { isIranMobile, phoneToLocal } from "@/lib/format";
import { sendOtpSms } from "@/lib/sms";

// The site URL plus any extra origins (www., preview domains) from env.
const trustedOrigins = [
  siteUrl,
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? siteUrl,
  trustedOrigins,

  // Admin toggles which of these two the storefront actually shows —
  // both stay configured here either way. See lib/queries/settings.ts.
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "CUSTOMER",
        input: false, // never settable from the public sign-up request
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,
  },

  // Limits live in the database (RateLimit model): on Vercel every request
  // may hit a different serverless instance, so the default in-memory
  // limiter would never actually trigger — and each OTP request costs an
  // SMS, which makes "SMS bombing" a real risk.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 30,
    customRules: {
      "/phone-number/send-otp": { window: 120, max: 3 },
      "/phone-number/verify": { window: 60, max: 10 },
      "/sign-in/email": { window: 60, max: 8 },
    },
  },

  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 3,
      phoneNumberValidator: (phone) => isIranMobile(phone),
      sendOTP: async ({ phoneNumber: phone, code }) => {
        // Awaited on purpose: on Vercel a fire-and-forget promise can be
        // frozen the moment the response is sent, and the SMS never leaves.
        const result = await sendOtpSms(phone, code);
        if (!result.success) throw new Error("SMS delivery failed");
      },
      signUpOnVerification: {
        // Better Auth's core user model requires an email; people who
        // sign up via phone get a non-routable placeholder they never
        // see, and can add a real email later from their account page.
        getTempEmail: (phone) => `${phone.replace(/[^\d]/g, "")}@phone.nikia.local`,
        getTempName: (phone) => phoneToLocal(phone),
      },
    }),
    nextCookies(), // must stay last — see Better Auth's Next.js integration docs
  ],
});

export type Session = typeof auth.$Infer.Session;
