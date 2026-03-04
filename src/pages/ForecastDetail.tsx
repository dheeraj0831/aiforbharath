import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import ClayCard from "@/components/ClayCard";
import ForecastChart from "@/components/ForecastChart";
import ForecastTable from "@/components/ForecastTable";
import RecommendationBadge from "@/components/RecommendationBadge";
import { ForecastResponse } from "@/services/api";

export default function ForecastDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state as ForecastResponse | null;

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-3xl px-4 py-12 text-center">
          <p className="text-muted-foreground">No forecast data. Go back and generate one first.</p>
          <button onClick={() => navigate("/dashboard")} className="mt-4 text-primary text-sm underline">
            ← Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  const weeklyStock = Math.round(data.forecast.mean.reduce((a, b) => a + b, 0));
  const suggestedPrice = data.recommendation === "REDUCE STOCK" ? Math.round(data.mrp * 0.95) : data.mrp;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl px-4 py-6 space-y-5">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-all duration-[250ms] hover:text-foreground hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <ClayCard className="text-center animate-fade-in-up">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Forecast Detail — {data.sku}</p>
          <RecommendationBadge recommendation={data.recommendation} className="mb-4" />
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Weekly Stock</p>
              <p className="text-foreground font-bold text-lg">{weeklyStock} units</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Suggested Price</p>
              <p className="text-foreground font-bold text-lg">₹{suggestedPrice}</p>
            </div>
          </div>
        </ClayCard>

        <ForecastChart dates={data.forecast.dates} mean={data.forecast.mean} low={data.forecast.low} high={data.forecast.high} large />
        <ForecastTable dates={data.forecast.dates} mean={data.forecast.mean} low={data.forecast.low} high={data.forecast.high} />
      </main>
    </div>
  );
}
