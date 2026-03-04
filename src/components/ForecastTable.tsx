import { Download, Printer } from "lucide-react";
import ClayCard from "./ClayCard";

interface ForecastTableProps {
  dates: string[];
  mean: number[];
  low: number[];
  high: number[];
}

export default function ForecastTable({ dates, mean, low, high }: ForecastTableProps) {
  const handleCSV = () => {
    const rows = [["Date", "Mean", "Low", "High"], ...dates.map((d, i) => [d, String(mean[i]), String(low[i]), String(high[i])])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forecast.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <ClayCard className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Daily Breakdown</h3>
        <div className="flex gap-2">
          <button onClick={handleCSV} className="p-2 rounded-xl transition-all duration-[250ms] hover:scale-110 hover:bg-muted" aria-label="Export CSV">
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={handlePrint} className="p-2 rounded-xl transition-all duration-[250ms] hover:scale-110 hover:bg-muted" aria-label="Print">
            <Printer className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm" aria-label="7-day forecast breakdown">
          <thead>
            <tr className="text-muted-foreground text-xs uppercase tracking-wider">
              <th className="text-left py-2 pr-4">Date</th>
              <th className="text-right py-2 px-3">Mean</th>
              <th className="text-right py-2 px-3">Low</th>
              <th className="text-right py-2 pl-3">High</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((d, i) => (
              <tr key={d} className="border-t border-border/50 text-foreground">
                <td className="py-2.5 pr-4 text-muted-foreground text-xs">{d}</td>
                <td className="text-right py-2.5 px-3 font-medium">{mean[i]}</td>
                <td className="text-right py-2.5 px-3 text-accent-red">{low[i]}</td>
                <td className="text-right py-2.5 pl-3 text-accent-green">{high[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ClayCard>
  );
}
