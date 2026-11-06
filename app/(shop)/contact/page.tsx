import type { Metadata } from "next";
import { ContactForm } from "@/components/shop/contact-form";
import { fillTemplate, siteConfig } from "@/lib/content";
import {
  ArrowRightIcon,
  Clock,
  CircleUserRound,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";
import { FaInstagram, FaTelegram, FaWhatsapp } from "react-icons/fa";
const { social } = siteConfig;
const c = siteConfig.contactPage;
const info = siteConfig.contact;

export const metadata: Metadata = {
  title: "تماس با ما",
  description:
    "راه‌های ارتباط با پشتیبانی نیکیا: تلفن، ایمیل، شوروم و فرم پیام.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const ROWS = [
    {
      icon: Phone,
      label: "شماره تماس",
      value: siteConfig.contact.phone,
      href: `tel:${siteConfig.contact.phone}`,
    },
    { icon: MapPin, label: "آدرس", value: siteConfig.contact.address },
    {
      icon: Navigation,
      label: "لوکیشن حضوری فروشگاه",
      value: "مشاهده مسیر روی نقشه",
      href: siteConfig.contact.mapUrl,
      external: true,
    },
    {
      icon: Clock,
      label: "ساعات پاسخ‌گویی",
      value: siteConfig.contact.supportHours,
    },
  ];
  const socialLinks = [
    { href: social.instagram, label: "اینستاگرام", Icon: FaInstagram },
    { href: social.telegram, label: "تلگرام", Icon: FaTelegram },
    { href: social.whatsapp, label: "تلگرام", Icon: FaWhatsapp },
  ].filter((s) => s.href);
  return (
    <>
      <section className="wrap flex flex-col gap-3.5 py-[clamp(40px,6vw,80px)]">
        <span className="text-xs tracking-[1px] text-muted-foreground">
          {c.eyebrow}
        </span>
        <h1 className="text-[clamp(30px,4.6vw,56px)] font-light leading-[1.4]">
          {c.headlinePre} <b className="font-semibold">{c.headlineBold}</b>
        </h1>
        <p className="max-w-[520px] text-[15px] leading-[2] text-body">
          {fillTemplate(c.intro, { supportHours: info.supportHours })}
        </p>
      </section>

      <section className="wrap flex flex-wrap items-start gap-[clamp(32px,5vw,64px)] pb-4">
        <dl className="flex-[1_1_260px]">
          {ROWS.map(({ icon: Icon, label, value, href, external }) => (
            <div key={label} className="flex items-center gap-4 py-5">
              <Icon className="size-5 shrink-0 text-black" strokeWidth={1.6} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                {href ? (
                  <a
                    href={href}
                    dir={external ? undefined : "ltr"}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="text-sm text-foreground hover:underline"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="text-sm text-foreground">{value}</p>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 py-5">
            <CircleUserRound
              className="size-5 shrink-0 text-black"
              strokeWidth={1.6}
            />
            <div>
              <p className="text-xs text-muted-foreground">
                با ما در ارتباط باشید در
              </p>
              <div className="flex gap-2.5">
                {socialLinks.map(({ href, label, Icon }) => (
                  <a
                    href={href}
                    dir="ltr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground hover:underline p-2"
                  >
                    <Icon className="size-6" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </dl>
      </section>
    </>
  );
}
