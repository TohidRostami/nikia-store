import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 text-[clamp(96px,16vw,160px)] font-light leading-none text-sand-3">۴۰۴</div>
        <h1 className="mb-2 text-2xl font-medium">این صفحه پیدا نشد</h1>
        <p className="mb-8 max-w-xs text-sm leading-8 text-muted-foreground">شاید لینک اشتباه بوده یا محصول دیگر موجود نیست.</p>
        <Link href="/" className="rounded-sm bg-ink px-7 py-3.5 text-sm text-paper transition-colors hover:bg-ink/90">
          بازگشت به خانه
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
