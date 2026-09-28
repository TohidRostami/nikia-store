import type { ServiceBadge } from "@/components/home/service-badges";
import { ServiceIcon } from "@/components/shared/service-icon";

export function ServiceBar({ badges }: { badges: ServiceBadge[] }) {
  return (
    <section className="wrap pt-[clamp(48px,6vw,72px)]">
      <ul className="grid gap-5 rounded-lg bg-sand p-6 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {badges.map((s) => (
          <li key={s.title} className="flex items-center justify-center gap-3.5">
            <ServiceIcon name={s.icon} className="size-7 shrink-0" />
            <span className="flex flex-col gap-1 text-[13px]">
              <b className="font-semibold">{s.title}</b>
              <span className="text-xs text-muted-foreground">{s.description}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
