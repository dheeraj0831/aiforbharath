import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CloudRain, Sun, PartyPopper, Wallet, Calendar, ArrowRight, ShoppingCart, Bookmark } from "lucide-react";
import Header from "@/components/Header";
import SkuForm from "@/components/SkuForm";
import ClayCard from "@/components/ClayCard";
import RecommendationBadge from "@/components/RecommendationBadge";
import ForecastChart from "@/components/ForecastChart";
import SignalBadge from "@/components/SignalBadge";
import AiAdvice from "@/components/AiAdvice";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorCard from "@/components/ErrorCard";
import { postForecast, ForecastResponse } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastReq, setLastReq] = useState<{ series_id: string; sku_name: string; mrp: number } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = useCallback(async (series_id: string, sku_name: string, mrp: number) => {
    setLoading(true);
    setError("");
    setData(null);
    setLastReq({ series_id, sku_name, mrp });
    try {
      const res = await postForecast({ series_id, sku_name, mrp });
      setData(res);
      toast({ title: "Forecast ready ✅", description: `Recommendation: ${res.recommendation}` });
    } catch (err: any) {
      // Auto retry once
      try {
        const res = await postForecast({ series_id, sku_name, mrp });
        setData(res);
        toast({ title: "Forecast ready ✅", description: `Recommendation: ${res.recommendation}` });
      } catch {
        setError(err?.message || "Failed to fetch forecast. Please try again.");
        toast({ title: "Error", description: "Could not fetch forecast.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleRetry = () => {
    if (lastReq) handleSubmit(lastReq.series_id, lastReq.sku_name, lastReq.mrp);
  };

  const pctChange = data ? (((data.forecast.forecast_avg - data.forecast.recent_avg) / data.forecast.recent_avg) * 100).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left column */}
          <div className="space-y-5">
            <SkuForm onSubmit={handleSubmit} isLoading={loading} />

            {loading && <LoadingSkeleton />}
            {error && <ErrorCard message={error} onRetry={handleRetry} />}

            {data && !loading && (
              <ClayCard className="animate-fade-in-up text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Recommendation</p>
                <RecommendationBadge recommendation={data.recommendation} className="mb-4" />
                <p className="text-sm text-foreground font-medium">{data.sku} — ₹{data.mrp}</p>
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Recent avg: <strong className="text-foreground">{data.forecast.recent_avg}</strong></span>
                  <span>Forecast avg: <strong className="text-foreground">{data.forecast.forecast_avg}</strong></span>
                  <span className={Number(pctChange) >= 0 ? "text-accent-green" : "text-accent-red"}>
                    {Number(pctChange) >= 0 ? "+" : ""}{pctChange}%
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 clay-sm py-2 rounded-xl text-xs font-medium text-primary flex items-center justify-center gap-1.5 transition-all duration-[250ms] hover:scale-[1.02]">
                    <ShoppingCart className="w-3.5 h-3.5" /> Order Suggested
                  </button>
                  <button className="flex-1 clay-sm py-2 rounded-xl text-xs font-medium text-muted-foreground flex items-center justify-center gap-1.5 transition-all duration-[250ms] hover:scale-[1.02]">
                    <Bookmark className="w-3.5 h-3.5" /> Save SKU
                  </button>
                </div>
              </ClayCard>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {data && !loading && (
              <>
                <ForecastChart dates={data.forecast.dates} mean={data.forecast.mean} low={data.forecast.low} high={data.forecast.high} />

                <ClayCard className="animate-fade-in-up">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Signals</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <SignalBadge icon={Sun} label="Temperature" value={`${data.signals.weather_c}°C`} color="text-accent-yellow" />
                    <SignalBadge icon={CloudRain} label="Rainfall" value={`${data.signals.rainfall_mm}mm`} color="text-accent-teal" />
                    <SignalBadge icon={PartyPopper} label="Festival" value={data.signals.festival.length ? data.signals.festival.join(", ") : "None"} color="text-accent-purple" />
                    <SignalBadge icon={Wallet} label="Payday Week" value={data.signals.payday_week ? "Yes" : "No"} color="text-accent-green" />
                    <SignalBadge icon={Calendar} label="Weekend" value={data.signals.weekend ? "Yes" : "No"} color="text-accent-teal" />
                  </div>
                </ClayCard>

                <AiAdvice advice={data.ai_advice} />

                <button
                  onClick={() => navigate("/forecast", { state: data })}
                  className="w-full clay-sm py-3 rounded-xl text-sm font-medium text-primary flex items-center justify-center gap-2 transition-all duration-[250ms] hover:scale-[1.02] active:scale-[0.98]"
                >
                  View Full Forecast <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {!data && !loading && !error && (
              <ClayCard className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Sun className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Enter a product to get started</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Select a series and MRP above</p>
              </ClayCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
