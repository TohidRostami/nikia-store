import { Headset, Lock, PackageCheck, RotateCcw, ShieldCheck, Truck, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  truck: Truck,
  return: RotateCcw,
  box: PackageCheck,
  lock: Lock,
  shield: ShieldCheck,
  headset: Headset,
};

/** Icon by the short names used in content/site-config.json. */
export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? PackageCheck;
  return <Icon className={className} strokeWidth={1.4} aria-hidden="true" />;
}
