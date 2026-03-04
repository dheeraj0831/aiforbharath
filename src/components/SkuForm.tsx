import { useState } from "react";
import { Search } from "lucide-react";
import ClayCard from "./ClayCard";

const SERIES_OPTIONS = [
  { id: "series_0", name: "Tata Dal 1kg" },
  { id: "series_1", name: "Aashirvaad Atta 5kg" },
  { id: "series_2", name: "Fortune Oil 1L" },
  { id: "series_3", name: "Parle-G 800g" },
  { id: "series_4", name: "Amul Butter 500g" },
];

interface SkuFormProps {
  onSubmit: (series_id: string, sku_name: string, mrp: number) => void;
  isLoading: boolean;
}

export default function SkuForm({ onSubmit, isLoading }: SkuFormProps) {
  const [seriesId, setSeriesId] = useState("");
  const [skuName, setSkuName] = useState("");
  const [mrp, setMrp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSeriesChange = (val: string) => {
    setSeriesId(val);
    const match = SERIES_OPTIONS.find((s) => s.id === val);
    if (match) setSkuName(match.name);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!seriesId) e.seriesId = "Select a series";
    if (!skuName.trim()) e.skuName = "Enter SKU name";
    if (!mrp || Number(mrp) <= 0) e.mrp = "Enter valid MRP";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(seriesId, skuName.trim(), Number(mrp));
  };

  return (
    <ClayCard className="animate-fade-in-up">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Check Demand</h2>

        <div>
          <label htmlFor="series" className="block text-xs text-muted-foreground mb-1.5">Product Series</label>
          <select
            id="series"
            value={seriesId}
            onChange={(e) => handleSeriesChange(e.target.value)}
            disabled={isLoading}
            className="w-full clay-inset px-3 py-2.5 rounded-xl text-sm text-foreground bg-bg-elev focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-[250ms]"
            aria-label="Select product series"
          >
            <option value="">Select series…</option>
            {SERIES_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.seriesId && <p className="text-accent-red text-xs mt-1">{errors.seriesId}</p>}
        </div>

        <div>
          <label htmlFor="skuName" className="block text-xs text-muted-foreground mb-1.5">SKU Name</label>
          <input
            id="skuName"
            type="text"
            value={skuName}
            onChange={(e) => setSkuName(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Tata Dal 1kg"
            className="w-full clay-inset px-3 py-2.5 rounded-xl text-sm text-foreground bg-bg-elev placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-[250ms]"
            aria-label="SKU name"
          />
          {errors.skuName && <p className="text-accent-red text-xs mt-1">{errors.skuName}</p>}
        </div>

        <div>
          <label htmlFor="mrp" className="block text-xs text-muted-foreground mb-1.5">MRP (₹)</label>
          <input
            id="mrp"
            type="number"
            value={mrp}
            onChange={(e) => setMrp(e.target.value)}
            disabled={isLoading}
            placeholder="120"
            min="1"
            className="w-full clay-inset px-3 py-2.5 rounded-xl text-sm text-foreground bg-bg-elev placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-[250ms]"
            aria-label="Maximum retail price"
          />
          {errors.mrp && <p className="text-accent-red text-xs mt-1">{errors.mrp}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full clay-sm py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-[250ms] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <Search className="w-4 h-4" />
          {isLoading ? "Forecasting…" : "Get Recommendation"}
        </button>
      </form>
    </ClayCard>
  );
}
