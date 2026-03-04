import { Copy, Check, Package, DollarSign, HelpCircle } from "lucide-react";
import { useState } from "react";
import { parseAdvice } from "@/utils/parseAdvice";
import ClayCard from "./ClayCard";

interface AiAdviceProps {
  advice: string;
}

export default function AiAdvice({ advice }: AiAdviceProps) {
  const [copied, setCopied] = useState(false);
  const parsed = parseAdvice(advice);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(advice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = [
    { key: "stock", icon: Package, label: "Stock", text: parsed.stock, color: "text-accent-teal" },
    { key: "price", icon: DollarSign, label: "Price", text: parsed.price, color: "text-accent-yellow" },
    { key: "why", icon: HelpCircle, label: "Why", text: parsed.why, color: "text-accent-purple" },
  ];

  return (
    <ClayCard className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI Advice</h3>
        <button
          onClick={handleCopy}
          className="p-2 rounded-xl transition-all duration-[250ms] hover:scale-110 hover:bg-muted"
          aria-label="Copy advice"
        >
          {copied ? <Check className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>
      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.key} className="clay-inset p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${s.color}`}>{s.label}</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </ClayCard>
  );
}
