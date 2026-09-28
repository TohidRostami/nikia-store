import { toPersianDigits } from "@/lib/format";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-border p-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" strokeWidth={1.6} />
      </div>
      <p className="flex flex-col mt-2 text-2xl font-bold">
        <span className="">{toPersianDigits(value)}</span>
        {unit && <span className="mr-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
