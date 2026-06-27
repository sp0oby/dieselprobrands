import {
  Zap, Droplet, Fuel, Wrench, Cog, BatteryFull, Key,
  Droplets, Waves, ToggleLeft, CircleDashed, GitBranch,
  Filter, Snowflake, Plug, Wind, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAP: Record<string, { Icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  "turbochargers":    { Icon: Zap,           tone: "text-amber-600 bg-amber-100" },
  "fuel-injectors":   { Icon: Droplet,       tone: "text-sky-600 bg-sky-100" },
  "fuel-pumps":       { Icon: Fuel,          tone: "text-brand-600 bg-brand/10" },
  "injection-pumps":  { Icon: Wrench,        tone: "text-slate-700 bg-slate-100" },
  "engine-parts":     { Icon: Cog,           tone: "text-zinc-700 bg-zinc-100" },
  "alternators":      { Icon: BatteryFull,   tone: "text-emerald-600 bg-emerald-100" },
  "starter-motors":   { Icon: Key,           tone: "text-yellow-600 bg-yellow-100" },
  "oil-pumps":        { Icon: Droplets,      tone: "text-orange-600 bg-orange-100" },
  "water-pumps":      { Icon: Waves,         tone: "text-cyan-600 bg-cyan-100" },
  "solenoid-valves":  { Icon: ToggleLeft,    tone: "text-indigo-600 bg-indigo-100" },
  "gaskets-seals":    { Icon: CircleDashed,  tone: "text-violet-600 bg-violet-100" },
  "belts-hoses":      { Icon: GitBranch,     tone: "text-pink-600 bg-pink-100" },
  "filters":          { Icon: Filter,        tone: "text-teal-600 bg-teal-100" },
  "cooling":          { Icon: Snowflake,     tone: "text-blue-600 bg-blue-100" },
  "electrical":       { Icon: Plug,          tone: "text-yellow-700 bg-yellow-100" },
  "hydraulics":       { Icon: Wind,          tone: "text-cyan-700 bg-cyan-50" },
  "ac-systems":       { Icon: Snowflake,     tone: "text-sky-700 bg-sky-50" },
  "drivetrain":       { Icon: Settings,      tone: "text-stone-700 bg-stone-100" },
};

export function CategoryIcon({ slug, size = "md" }: { slug: string; size?: "sm" | "md" }) {
  const m = MAP[slug] ?? { Icon: Cog, tone: "text-ink bg-black/5" };
  const box = size === "sm" ? "size-9" : "size-11";
  const icon = size === "sm" ? "size-4" : "size-5";
  return (
    <span className={cn("grid place-items-center rounded-lg", box, m.tone)}>
      <m.Icon className={icon} />
    </span>
  );
}
