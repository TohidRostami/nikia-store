import Link from "next/link";
import { toJalaali } from "jalaali-js";
import { InstagramIcon, TelegramIcon } from "@/components/shared/social-icons";
import { Logo } from "@/components/shared/logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { siteConfig } from "@/lib/content";
import { toPersianDigits } from "@/lib/format";
import { FaWhatsapp, FaInstagram, FaTelegram } from "react-icons/fa";
export function SiteFooter() {
  const year = toJalaali(new Date()).jy;
  const { contact, social, nav } = siteConfig;

  const socialLinks = [
    { href: social.instagram, label: "اینستاگرام", Icon: FaInstagram },
    { href: social.telegram, label: "تلگرام", Icon: FaTelegram },
    { href: social.telegram, label: "تلگرام", Icon: FaWhatsapp },
  ].filter((s) => s.href);

  return (
    <footer className="mt-[clamp(56px,8vw,96px)] bg-ink text-line">
      <div className="wrap grid gap-x-5 gap-y-8 pb-8 pt-[clamp(48px,6vw,72px)] [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))] sm:gap-10 sm:[grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
        <div className="flex min-w-0 flex-col gap-4">
          <Logo className="text-paper [&>span:last-child]:text-[#a89d8f]" />
          <p className="text-[13px] leading-[2.1] text-[#b8aea1] [text-wrap:pretty]">
            {siteConfig.site.shortDescription}
          </p>
          <div className="flex gap-2.5">
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-full border border-[#3a3631] text-line transition-colors hover:border-line hover:text-paper"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {nav.footerColumns.map((col) => (
          <div
            key={col.title}
            className="flex min-w-0 flex-col gap-3 text-[13px]"
          >
            <div className="mb-1.5 text-sm font-semibold text-paper">
              {col.title}
            </div>
            {col.links.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="text-[#b8aea1] transition-colors hover:text-paper"
              >
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="wrap flex flex-wrap justify-between gap-3 border-t border-[#2c2925] pb-7 pt-5 text-xs text-[#8f857a]">
        <span>
          © {toPersianDigits(year)} {siteConfig.site.name}. تمامی حقوق محفوظ
          است.
        </span>
        <span>
          {contact.shortAddress} ·{" "}
          <a href={contact.phoneHref}>{contact.phone}</a>
        </span>
      </div>
    </footer>
  );
}
