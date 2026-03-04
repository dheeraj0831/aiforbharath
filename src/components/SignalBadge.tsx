import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SignalBadgeProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color?: string;
}

export default function SignalBadge({ icon: Icon, label, value, color = "text-accent-teal" }: SignalBadgeProps) {
  return (
    <div className="clay-sm p-3 flex items-center gap-3 transition-all duration-[250ms] hover:scale-[1.02]">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-muted", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
