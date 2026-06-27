import {
  Zap, Droplet, Fuel, Wrench, Cog, BatteryFull, Key,
  Droplets, Waves, ToggleLeft, CircleDashed, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAP: Record<string, { Icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  "turbochargers":    { Icon: Zap,           tone: "text-amber-400 bg-amber-500/10" },
  "fuel-injectors":   { Icon: Droplet,       tone: "text-sky-400 bg-sky-500/10" },
  "fuel-pumps":       { Icon: Fuel,          tone: "text-brand-400 bg-brand/15" },
  "injection-pumps":  { Icon: Wrench,        tone: "text-slate-200 bg-black/5" },
  "engine-parts":     { Icon: Cog,           tone: "text-zinc-200 bg-black/5" },
  "alternators":      { Icon: BatteryFull,   tone: "text-emerald-400 bg-emerald-500/10" },
  "starter-motors":   { Icon: Key,           tone: "text-yellow-300 bg-yellow-500/10" },
  "oil-pumps":        { Icon: Droplets,      tone: "text-orange-400 bg-orange-500/10" },
  "water-pumps":      { Icon: Waves,         tone: "text-cyan-400 bg-cyan-500/10" },
  "solenoid-valves":  { Icon: ToggleLeft,    tone: "text-indigo-400 bg-indigo-500/10" },
  "gaskets-seals":    { Icon: CircleDashed,  tone: "text-violet-400 bg-violet-500/10" },
  "belts-hoses":      { Icon: GitBranch,     tone: "text-pink-400 bg-pink-500/10" },
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
