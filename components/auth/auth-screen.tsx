import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import { siteConfig } from "@/lib/content";
import { getSession, safeRedirectPath } from "@/lib/session";
import { getSiteSettings } from "@/lib/queries/settings";

/** Shared by /login and /register: the split screen from the design. */
export async function AuthScreen({
  mode,
  redirectParam,
}: {
  mode: "login" | "register";
  redirectParam?: string;
}) {
  const redirectTo = safeRedirectPath(redirectParam);
  const [session, settings] = await Promise.all([getSession(), getSiteSettings()]);
  if (session) redirect(redirectTo);

  return (
    <>
      <div className="relative min-h-[clamp(240px,40vw,720px)] flex-[1_1_420px] overflow-hidden bg-[#e9e1d5]">
        <ProductPlaceholder categorySlug="manto" tint="#D9CBB5" className="[&_svg]:h-1/3 [&_svg]:w-1/3" />
        <div className="pointer-events-none absolute inset-x-8 bottom-8 text-[clamp(20px,2.4vw,30px)] font-light leading-[1.6] text-ink">
          {siteConfig.auth.sideLight}
          <br />
          <b className="font-semibold">{siteConfig.auth.sideBold}</b>
        </div>
      </div>
      <div className="flex flex-[1_1_420px] items-center justify-center px-4 py-[clamp(40px,6vw,80px)] sm:px-10">
        <AuthForm mode={mode} emailEnabled={settings.emailLoginEnabled} smsEnabled={settings.smsLoginEnabled} redirectTo={redirectTo} />
      </div>
    </>
  );
}
