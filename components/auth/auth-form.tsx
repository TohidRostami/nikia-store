"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OtpInput } from "@/components/auth/otp-input";
import { authClient } from "@/lib/auth-client";
import { normalizeIranPhone, phoneToLocal, toPersianDigits, isIranMobile } from "@/lib/format";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";
type Method = "phone" | "email";

const fieldClass =
  "h-[52px] w-full rounded-sm border border-line bg-white px-3.5 text-[15px] outline-none transition-colors placeholder:text-muted-foreground focus:border-ink";
const primaryBtn =
  "h-[52px] w-full rounded-sm bg-ink text-[15px] text-paper transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50";

export function AuthForm({
  mode,
  emailEnabled,
  smsEnabled,
  redirectTo,
}: {
  mode: Mode;
  emailEnabled: boolean;
  smsEnabled: boolean;
  redirectTo: string;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>(smsEnabled ? "phone" : "email");

  function done() {
    router.push(redirectTo);
    router.refresh();
  }

  const q = redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : "";
  const tabs: { key: Mode; label: string; href: string }[] = [
    { key: "login", label: "ورود", href: `/login${q}` },
    { key: "register", label: "ثبت‌نام", href: `/register${q}` },
  ];

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-6">
      <div className="flex border-b border-[#e2dace]" role="tablist">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            role="tab"
            aria-selected={t.key === mode}
            className={cn(
              "-mb-px flex-1 border-b-2 py-3.5 text-center text-[15px] font-medium transition-colors",
              t.key === mode ? "border-ink text-ink" : "border-transparent text-muted-foreground hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {!emailEnabled && !smsEnabled ? (
        <p className="text-center text-sm text-muted-foreground">در حال حاضر هیچ روش ورودی فعال نیست. لطفاً بعداً دوباره تلاش کنید.</p>
      ) : method === "phone" ? (
        <PhoneFlow mode={mode} onDone={done} />
      ) : (
        <EmailFlow mode={mode} onDone={done} />
      )}

      {emailEnabled && smsEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs text-[#a89d8f]">
            <span className="h-px flex-1 bg-[#e2dace]" />
            یا
            <span className="h-px flex-1 bg-[#e2dace]" />
          </div>
          <button
            type="button"
            onClick={() => setMethod(method === "phone" ? "email" : "phone")}
            className="h-[52px] rounded-sm border border-line bg-white text-sm transition-colors hover:border-ink"
          >
            {method === "phone"
              ? `${mode === "login" ? "ورود" : "ثبت‌نام"} با ایمیل و رمز عبور`
              : `${mode === "login" ? "ورود" : "ثبت‌نام"} با شماره موبایل`}
          </button>
        </>
      )}
    </div>
  );
}

/* ───────────────────────────── phone + OTP ───────────────────────────── */

const RESEND_SECONDS = 120;

function PhoneFlow({ mode, onDone }: { mode: Mode; onDone: () => void }) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(mode === "login");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    if (mode === "register" && name.trim().length < 2) return setError("نام و نام‌خانوادگی را وارد کنید.");
    if (!isIranMobile(phone)) return setError("شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).");
    if (!agreed) return setError("برای ثبت‌نام باید با قوانین و حریم خصوصی موافقت کنید.");

    setLoading(true);
    const normalized = normalizeIranPhone(phone);
    const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: normalized });
    setLoading(false);
    if (error) {
      setError(error.status === 429 ? "درخواست‌های زیادی ثبت شده؛ چند دقیقه بعد دوباره تلاش کنید." : "ارسال کد ناموفق بود. شماره را بررسی و دوباره تلاش کنید.");
      return;
    }
    setPhone(normalized);
    setCode("");
    setCooldown(RESEND_SECONDS);
    setStep("code");
  }

  async function verify(value = code) {
    if (value.length < 6 || loading) return;
    setLoading(true);
    setError(null);
    const { error } = await authClient.phoneNumber.verify({ phoneNumber: phone, code: value });
    if (error) {
      setLoading(false);
      setError("کد وارد شده صحیح نیست یا منقضی شده است.");
      return;
    }
    // A brand-new phone account is created named after the number; give it the real name.
    if (mode === "register" && name.trim()) await authClient.updateUser({ name: name.trim() });
    setLoading(false);
    toast.success("خوش آمدید");
    onDone();
  }

  if (step === "code") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void verify();
        }}
        className="flex flex-col gap-[18px]"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium">کد تأیید را وارد کنید</h1>
          <p className="text-[13px] leading-8 text-body">
            کد ۶ رقمی به شماره <span className="font-nums">{toPersianDigits(phoneToLocal(phone))}</span> پیامک شد.
          </p>
        </div>
        <OtpInput value={code} onChange={setCode} invalid={Boolean(error)} onComplete={(c) => void verify(c)} />
        {error && (
          <p role="alert" className="text-center text-sm text-sale">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading || code.length < 6} className={primaryBtn}>
          {loading ? "در حال بررسی…" : "تأیید و ورود"}
        </button>
        <div className="flex justify-between text-[13px] text-body">
          <button type="button" onClick={() => { setStep("phone"); setError(null); }} className="text-ink underline">
            ویرایش شماره
          </button>
          {cooldown > 0 ? (
            <span>ارسال مجدد تا {toPersianDigits(`${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, "0")}`)}</span>
          ) : (
            <button type="button" onClick={() => void sendCode()} disabled={loading} className="text-ink underline">
              ارسال مجدد کد
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">{mode === "login" ? "ورود به حساب کاربری" : "ساخت حساب کاربری"}</h1>
        <p className="text-[13px] leading-8 text-body">
          {mode === "login"
            ? "شماره موبایل خود را وارد کنید تا کد تأیید برایتان پیامک شود."
            : "با شماره موبایل ثبت‌نام کنید؛ رمز عبور لازم نیست."}
        </p>
      </div>
      {mode === "register" && (
        <label className="flex flex-col gap-2 text-[13px]">
          نام و نام خانوادگی
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً سارا محمدی" autoComplete="name" className={fieldClass} />
        </label>
      )}
      <label className="flex flex-col gap-2 text-[13px]">
        شماره موبایل
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          inputMode="numeric"
          autoComplete="tel"
          dir="ltr"
          className={cn(fieldClass, "text-right tracking-[1px]")}
        />
      </label>
      {mode === "register" && (
        <label className="flex items-start gap-2.5 text-xs leading-[1.9] text-body">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-ink" />
          <span>
            با{" "}
            <Link href="/privacy" target="_blank" className="underline">
              قوانین و حریم خصوصی
            </Link>{" "}
            نیکیا موافقم.
          </span>
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-sale">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className={primaryBtn}>
        {loading ? "در حال ارسال…" : "دریافت کد تأیید"}
      </button>
    </form>
  );
}

/* ─────────────────────────── email + password ─────────────────────────── */

function EmailFlow({ mode, onDone }: { mode: Mode; onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "register" && name.trim().length < 2) return setError("نام و نام‌خانوادگی را وارد کنید.");
    setLoading(true);
    const { error } =
      mode === "login"
        ? await authClient.signIn.email({ email: email.trim(), password })
        : await authClient.signUp.email({ email: email.trim(), password, name: name.trim() });
    setLoading(false);
    if (error) {
      setError(
        mode === "login"
          ? error.status === 429
            ? "تلاش‌های ناموفق زیاد بوده؛ کمی بعد دوباره تلاش کنید."
            : "ایمیل یا رمز عبور اشتباه است."
          : (error.message ?? "ثبت‌نام ناموفق بود."),
      );
      return;
    }
    toast.success(mode === "login" ? "خوش آمدید" : "ثبت‌نام با موفقیت انجام شد");
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-[18px]">
      <h1 className="text-2xl font-medium">{mode === "login" ? "ورود با ایمیل" : "ثبت‌نام با ایمیل"}</h1>
      {mode === "register" && (
        <label className="flex flex-col gap-2 text-[13px]">
          نام و نام خانوادگی
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required className={fieldClass} />
        </label>
      )}
      <label className="flex flex-col gap-2 text-[13px]">
        ایمیل
        <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={cn(fieldClass, "text-right")} />
      </label>
      <label className="flex flex-col gap-2 text-[13px]">
        رمز عبور {mode === "register" && <span className="text-xs text-muted-foreground">(حداقل ۸ کاراکتر)</span>}
        <input
          type="password"
          dir="ltr"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          className={cn(fieldClass, "text-right")}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-sale">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className={primaryBtn}>
        {loading ? "در حال پردازش…" : mode === "login" ? "ورود" : "ثبت‌نام"}
      </button>
    </form>
  );
}
