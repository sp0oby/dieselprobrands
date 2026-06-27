import {
  Zap, Droplet, Fuel, Wrench, Cog, BatteryFull, Key,
  Droplets, Waves, ToggleLeft, CircleDashed, GitBranch,
  Filter, Snowflake, Plug, Wind, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "turbochargers":    Zap,
  "fuel-injectors":   Droplet,
  "fuel-pumps":       Fuel,
  "injection-pumps":  Wrench,
  "engine-parts":     Cog,
  "alternators":      BatteryFull,
  "starter-motors":   Key,
  "oil-pumps":        Droplets,
  "water-pumps":      Waves,
  "solenoid-valves":  ToggleLeft,
  "gaskets-seals":    CircleDashed,
  "belts-hoses":      GitBranch,
  "filters":          Filter,
  "cooling":          Snowflake,
  "electrical":       Plug,
  "hydraulics":       Wind,
  "ac-systems":       Snowflake,
  "drivetrain":       Settings,
};

export function CategoryIcon({ slug, size = "md" }: { slug: string; size?: "sm" | "md" }) {
  const Icon = ICONS[slug] ?? Cog;
  const box = size === "sm" ? "size-9" : "size-11";
  const icon = size === "sm" ? "size-4" : "size-5";
  return (
    <span className={cn("grid place-items-center rounded-lg bg-bg-elev text-ink", box)}>
      <Icon className={icon} />
    </span>
  );
}
