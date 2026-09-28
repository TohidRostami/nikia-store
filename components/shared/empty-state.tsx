import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-white px-6 py-16 text-center">
      <Icon className="size-10 text-muted-foreground" strokeWidth={1.2} />
      <p className="text-base font-medium">{title}</p>
      {description && <p className="max-w-xs text-sm leading-7 text-muted-foreground">{description}</p>}
      {actionLabel && actionHref && (
        <Button asChild size="sm" className="mt-2">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
