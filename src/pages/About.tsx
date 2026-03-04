import { ArrowLeft, Database, BarChart3, Cpu, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ClayCard from "@/components/ClayCard";

const steps = [
  { icon: Database, label: "Your Input", desc: "SKU name and MRP from your store", color: "text-accent-teal" },
  { icon: BarChart3, label: "Forecast Engine", desc: "7-day demand prediction using ML models", color: "text-accent-purple" },
  { icon: Zap, label: "Real-time Signals", desc: "Weather, festivals, payday, weekend patterns", color: "text-accent-yellow" },
  { icon: Cpu, label: "AI Advice", desc: "Plain-English stock and pricing guidance", color: "text-accent-green" },
];

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl px-4 py-6 space-y-5">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-all duration-[250ms] hover:text-foreground hover:scale-105">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <ClayCard className="animate-fade-in-up">
          <h1 className="text-lg font-bold text-foreground mb-2">How KiranaIQ Works</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            KiranaIQ helps small store owners make smarter stock and pricing decisions. Enter your product details
            and get a 7-day demand forecast powered by machine learning, enriched with real-time signals.
          </p>
        </ClayCard>

        <div className="space-y-3">
          {steps.map((s, i) => (
            <ClayCard key={s.label} elevation="low" className="animate-fade-in-up flex items-start gap-4" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-9 bottom-0 w-px h-3 bg-border/50 translate-y-full" />
              )}
            </ClayCard>
          ))}
        </div>

        <ClayCard elevation="low" className="animate-fade-in-up">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Built With</h2>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {["React", "TypeScript", "TailwindCSS", "Recharts", "Vite", "shadcn/ui"].map((t) => (
              <span key={t} className="clay-inset px-3 py-1.5 rounded-lg">{t}</span>
            ))}
          </div>
        </ClayCard>
      </main>
    </div>
  );
}
