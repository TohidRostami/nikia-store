/**
 * SMS OTP delivery via sms.ir's Verify (template-based) send API — the
 * endpoint sms.ir specifically built for one-time codes, distinct from
 * their general-purpose bulk SMS sending. Reimplemented here with
 * native fetch rather than added as a dependency (the "sms-typescript"
 * package is just a thin wrapper around one fetch call) — the exact
 * base URL, endpoint path, and header name below were confirmed
 * directly from that package's own source code, not guessed.
 *
 * POST https://api.sms.ir/v1/send/verify/
 *
 * Setup on sms.ir's side (one-time, in their panel):
 *   1. برنامه‌نویسان ← قالب‌های ماژول ارسال سریع ← افزودن قالب
 *   2. متن قالب باید یک متغیر با # دورش داشته باشد، مثلاً:
 *      «کد ورود شما به نیکیا: #code# است.»
 *   3. منتظر تأیید کارشناسان سامانه پیامک بمانید (چند دقیقه تا چند ساعت).
 *   4. بعد از تأیید، شناسه‌ی قالب (عدد قرمزرنگ انتهای قالب) را بردارید.
 *   5. کلید API را از «برنامه‌نویسان ← کلید وب‌سرویس» بردارید.
 *
 * Until SMSIR_API_KEY is set, OTP codes are only logged to the server
 * console — safe for local development, no SMS account or cost involved.
 */

const SMSIR_BASE_URL = "https://api.sms.ir";

type SendOtpResult = { success: boolean };

function isConfigured(): boolean {
  return Boolean(
    process.env.SMSIR_API_KEY && process.env.SMSIR_VERIFY_TEMPLATE_ID,
  );
}

// sms.ir expects a local-format number (09xxxxxxxxx), not E.164 — the
// rest of the app normalizes to +98 for storage/auth, so this is the
// one place that converts back for the provider's expected format.
function toLocalFormat(e164Phone: string): string {
  const digits = e164Phone.replace(/\D/g, "");
  if (digits.startsWith("98")) return `0${digits.slice(2)}`;
  return digits.startsWith("0") ? digits : `0${digits}`;
}

async function sendViaSmsIr(
  phoneNumber: string,
  code: string,
): Promise<SendOtpResult> {
  const apiKey = process.env.SMSIR_API_KEY!;
  const templateId = Number(process.env.SMSIR_VERIFY_TEMPLATE_ID);
  // Must exactly match the variable name used inside the template's
  // #...# placeholder in the sms.ir panel (defaults to "code").
  const paramName = process.env.SMSIR_VERIFY_PARAM_NAME || "code";

  try {
    const res = await fetch(`${SMSIR_BASE_URL}/v1/send/verify/`, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile: toLocalFormat(phoneNumber),
        templateId,
        parameters: [{ name: paramName, value: code }],
      }),
      // A hung provider must not hold a serverless function open.
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const errorBody = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      // Logged server-side for debugging, but the code itself is never
      // included, and the caller only ever sees a plain success/failure
      // boolean.
      console.error(
        `[sms.ir] send failed — HTTP ${res.status}: ${errorBody?.message ?? "unknown error"}`,
      );
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.error(
      "[sms.ir] request failed:",
      err instanceof Error ? err.message : err,
    );
    return { success: false };
  }
}

export async function sendOtpSms(
  phoneNumber: string,
  code: string,
): Promise<SendOtpResult> {
  if (!isConfigured()) {
    // Never print codes in production: anyone who can read the logs could
    // sign in as any customer. A misconfigured production site fails loudly
    // instead of "sending" nothing.
    if (process.env.NODE_ENV === "production") {
      console.error("[sms.ir] SMSIR_API_KEY / SMSIR_VERIFY_TEMPLATE_ID are not set — OTP not sent.");
      return { success: false };
    }
    console.log(`[SMS · DEV MODE] → ${phoneNumber}: کد ${code}`);
    return { success: true };
  }
  return sendViaSmsIr(phoneNumber, code);
}
