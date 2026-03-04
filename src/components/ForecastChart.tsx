import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ClayCard from "./ClayCard";

interface ForecastChartProps {
  dates: string[];
  mean: number[];
  low: number[];
  high: number[];
  large?: boolean;
}

export default function ForecastChart({ dates, mean, low, high, large }: ForecastChartProps) {
  const data = dates.map((d, i) => ({
    date: d.slice(5),
    mean: mean[i],
    low: low[i],
    high: high[i],
  }));

  return (
    <ClayCard className="animate-fade-in-up">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">7-Day Forecast</h3>
      <div className={large ? "h-80" : "h-52"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
            <defs>
              <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#c084fc" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#1a2238",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "1rem",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                fontSize: 12,
              }}
              labelStyle={{ color: "#f8fafc" }}
              itemStyle={{ color: "#94a3b8" }}
            />
            <Area type="monotone" dataKey="high" stroke="none" fill="url(#bandGradient)" />
            <Area type="monotone" dataKey="low" stroke="none" fill="hsl(var(--bg-elev))" />
            <Area type="monotone" dataKey="high" stroke="#c084fc" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="High" />
            <Area type="monotone" dataKey="low" stroke="#c084fc" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="Low" />
            <Area type="monotone" dataKey="mean" stroke="#c084fc" strokeWidth={2.5} fill="none" name="Mean" dot={{ r: 3, fill: "#c084fc" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Accessible fallback */}
      <details className="mt-3">
        <summary className="text-xs text-muted-foreground cursor-pointer">View as table</summary>
        <table className="w-full mt-2 text-xs text-muted-foreground" aria-label="Forecast data table">
          <thead>
            <tr>
              <th className="text-left py-1">Date</th><th className="text-right py-1">Mean</th><th className="text-right py-1">Low</th><th className="text-right py-1">High</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.date}>
                <td className="py-1">{r.date}</td><td className="text-right">{r.mean}</td><td className="text-right">{r.low}</td><td className="text-right">{r.high}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </ClayCard>
  );
}
