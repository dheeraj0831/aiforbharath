import { AlertTriangle, RefreshCw } from "lucide-react";
import ClayCard from "./ClayCard";

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <ClayCard className="animate-fade-in-up border-accent-red/20">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent-red/15 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-accent-red" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Something went wrong</p>
          <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-all duration-[250ms] hover:scale-105"
            >
              <RefreshCw className="w-3 h-3" /> Try again
            </button>
          )}
        </div>
      </div>
    </ClayCard>
  );
}
