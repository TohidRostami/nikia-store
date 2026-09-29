import type { Metadata } from "next";
import { ContactForm } from "@/components/shop/contact-form";
import { fillTemplate, siteConfig } from "@/lib/content";

const c = siteConfig.contactPage;
const info = siteConfig.contact;

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه‌های ارتباط با پشتیبانی نیکیا: تلفن، ایمیل، شوروم و فرم پیام.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const rows: { label: string; content: React.ReactNode }[] = [
    { label: "تلفن پشتیبانی", content: <a href={info.phoneHref} className="hover:text-muted-foreground">{info.phone}</a> },
    { label: "واتساپ و تلگرام", content: <a href={info.whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground">{info.mobile}</a> },
    { label: "ایمیل", content: <a href={`mailto:${info.email}`} dir="ltr" className="hover:text-muted-foreground">{info.email}</a> },
    {
      label: "شوروم",
      content: (
        <span>
          {info.address}
          <br />
          <span className="text-xs text-muted-foreground">{info.showroomHours}</span>
        </span>
      ),
    },
  ];

  return (
    <>
      <section className="wrap flex flex-col gap-3.5 py-[clamp(40px,6vw,80px)]">
        <span className="text-xs tracking-[1px] text-muted-foreground">{c.eyebrow}</span>
        <h1 className="text-[clamp(30px,4.6vw,56px)] font-light leading-[1.4]">
          {c.headlinePre} <b className="font-semibold">{c.headlineBold}</b>
        </h1>
        <p className="max-w-[520px] text-[15px] leading-[2] text-body">{fillTemplate(c.intro, { supportHours: info.supportHours })}</p>
      </section>

      <section className="wrap flex flex-wrap items-start gap-[clamp(32px,5vw,64px)] pb-4">
        <dl className="flex-[1_1_260px]">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col gap-1.5 border-b border-[#e2dace] py-5">
              <dt className="text-xs text-muted-foreground">{r.label}</dt>
              <dd className="text-[15px]">{r.content}</dd>
            </div>
          ))}
        </dl>
        {/* <div className="min-w-0 flex-[1.4_1_420px] rounded-lg border border-hairline bg-white p-[clamp(20px,3vw,36px)]">
          <ContactForm subjects={c.subjects} sentTitle={c.sentTitle} sentText={c.sentText} />
        </div> */}
      </section>
    </>
  );
}
