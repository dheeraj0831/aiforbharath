import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationBadgeProps {
  recommendation: "STOCK UP" | "REDUCE STOCK" | "MAINTAIN";
  className?: string;
}

const config = {
  "STOCK UP": { icon: TrendingUp, bg: "bg-accent-green/15", text: "text-accent-green", border: "border-accent-green/20" },
  "REDUCE STOCK": { icon: TrendingDown, bg: "bg-accent-red/15", text: "text-accent-red", border: "border-accent-red/20" },
  "MAINTAIN": { icon: Minus, bg: "bg-accent-yellow/15", text: "text-accent-yellow", border: "border-accent-yellow/20" },
};

export default function RecommendationBadge({ recommendation, className }: RecommendationBadgeProps) {
  const c = config[recommendation];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border animate-scale-in",
        c.bg, c.text, c.border, className
      )}
      role="status"
      aria-label={`Recommendation: ${recommendation}`}
    >
      <Icon className="w-5 h-5" />
      {recommendation}
    </span>
  );
}
