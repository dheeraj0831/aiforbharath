import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export interface ForecastRequest {
  series_id: string;
  sku_name: string;
  mrp: number;
}

export interface ForecastResponse {
  sku: string;
  mrp: number;
  recommendation: "STOCK UP" | "REDUCE STOCK" | "MAINTAIN";
  forecast: {
    mean: number[];
    low: number[];
    high: number[];
    dates: string[];
    recent_avg: number;
    forecast_avg: number;
  };
  signals: {
    festival: string[];
    payday_week: boolean;
    weekend: boolean;
    weather_c: number;
    rainfall_mm: number;
  };
  ai_advice: string;
}

function generateMockResponse(req: ForecastRequest): ForecastResponse {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split("T")[0];
  });

  const baseDemand = 40 + Math.random() * 30;
  const mean = dates.map(() => Math.round(baseDemand + (Math.random() - 0.3) * 15));
  const low = mean.map((m) => Math.round(m * 0.75));
  const high = mean.map((m) => Math.round(m * 1.3));
  const recent_avg = Math.round(baseDemand * 0.9);
  const forecast_avg = Math.round(mean.reduce((a, b) => a + b, 0) / mean.length);

  const recommendation = forecast_avg > recent_avg + 5 ? "STOCK UP" : forecast_avg < recent_avg - 5 ? "REDUCE STOCK" : "MAINTAIN";

  return {
    sku: req.sku_name,
    mrp: req.mrp,
    recommendation,
    forecast: { mean, low, high, dates, recent_avg, forecast_avg },
    signals: {
      festival: Math.random() > 0.5 ? ["Diwali", "Navratri"] : [],
      payday_week: Math.random() > 0.5,
      weekend: new Date().getDay() >= 5,
      weather_c: Math.round(25 + Math.random() * 15),
      rainfall_mm: Math.round(Math.random() * 40),
    },
    ai_advice: `STOCK: ${recommendation === "STOCK UP" ? "Increase stock by 20-25%. Demand is trending upward this week." : recommendation === "REDUCE STOCK" ? "Reduce orders by 15%. Demand is expected to drop." : "Keep current stock levels. Demand is stable."} PRICE: ${req.mrp > 100 ? "Consider a ₹5 discount to boost volume." : "Hold current MRP — competitive pricing."} WHY: ${forecast_avg > recent_avg ? "Festival season and weekend boost expected demand." : "No major demand drivers this week. Weather is moderate."}`,
  };
}

let retryCount = 0;

export async function postForecast(req: ForecastRequest): Promise<ForecastResponse> {
  if (!BASE_URL) {
    // Mock mode
    await new Promise((r) => setTimeout(r, 1200));
    // Simulate occasional failure for retry logic
    if (retryCount === 0 && Math.random() < 0.15) {
      retryCount++;
      throw new Error("Network error — retrying...");
    }
    retryCount = 0;
    return generateMockResponse(req);
  }

  try {
    const { data } = await axios.post<ForecastResponse>(`${BASE_URL}/forecast`, req);
    retryCount = 0;
    return data;
  } catch (err) {
    if (retryCount < 1) {
      retryCount++;
      return postForecast(req);
    }
    retryCount = 0;
    throw err;
  }
}
