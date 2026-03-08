import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";

// ─── Types ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  intent?: string;
  data?: Record<string, unknown>;
  suggestedReplies?: string[];
}

export interface ChatRequest {
  message: string;
  userId: string;
  conversationHistory: { role: string; content: string }[];
}

export interface ChatResponse {
  reply: string;
  intent: string;
  data: Record<string, unknown>;
  suggestedReplies?: string[];
}

// ─── Mock helpers ───────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mockParseIntent(message: string): ChatResponse {
  const lower = message.toLowerCase();

  // Add SKU intent
  const skuMatch = lower.match(/add\s+sku\s+(.+?)(?:\s+(?:with\s+)?mrp\s+(\d+))?$/i);
  if (skuMatch || lower.includes("add sku") || lower.includes("new product") || lower.includes("new sku")) {
    const skuName = skuMatch?.[1]?.replace(/(?:with\s+)?mrp\s+\d+/i, "").trim() || "New Product";
    const mrp = skuMatch?.[2] || "99";
    const seriesId = `series_${20 + Math.floor(Math.random() * 10)}`;
    return {
      reply: `✅ SKU "${skuName}" (MRP ₹${mrp}) added successfully! Use series_id **${seriesId}** for forecasting.`,
      intent: "add_sku",
      data: { series_id: seriesId, sku_name: skuName, mrp: Number(mrp) },
      suggestedReplies: ["Show my SKU catalog", `Forecast for ${skuName}`, "Add another SKU"],
    };
  }

  // Forecast intent
  if (lower.includes("forecast") || lower.includes("demand") || lower.includes("predict")) {
    const product = message.replace(/.*(?:forecast|demand|predict)\s*(?:for|of)?\s*/i, "").trim() || "your product";
    return {
      reply: `📊 To get a forecast for ${product}, head to the Dashboard and enter the SKU details. I'll show you 7-day demand predictions with weather, festival, and payday signals!`,
      intent: "get_forecast",
      data: { redirect: "/dashboard", sku_name: product },
      suggestedReplies: ["Check training status", "Add a new SKU", "Show my SKU catalog"],
    };
  }

  // Training intent
  if (lower.includes("train") || lower.includes("retrain") || lower.includes("upload csv")) {
    return {
      reply: "Got it! To start training, please upload your sales CSV/Excel file from the Shop Dashboard. I'll kick off the AI training automatically once it's uploaded. 🚀",
      intent: "start_training",
      data: { redirect: "/shop-dashboard" },
      suggestedReplies: ["Check training status", "Show my SKU catalog", "What can you do?"],
    };
  }

  // Status check
  if (lower.includes("status") || lower.includes("progress") || lower.includes("ready")) {
    return {
      reply: "🔄 Your AI model is currently training. I'll let you know when it's ready! Check the Shop Dashboard for real-time progress.",
      intent: "check_status",
      data: { training_status: "TRAINING" },
      suggestedReplies: ["Show my SKU catalog", "Add a new SKU", "Forecast for Tata Salt"],
    };
  }

  // Help
  if (lower.includes("help") || lower.includes("what can you do") || lower.includes("capabilities")) {
    return {
      reply: `Here's what I can help you with:\n\n• **Add a new SKU** — "Add SKU Amul Paneer 200g MRP 95"\n• **Get demand forecast** — "Forecast for Tata Salt"\n• **Start AI training** — "Train model for my store"\n• **Check training status** — "What's my training status?"\n\nJust type naturally and I'll handle the rest! 🤖`,
      intent: "general",
      data: {},
      suggestedReplies: ["Add a new SKU", "Show my SKU catalog", "Check training status", "Forecast for Tata Salt"],
    };
  }

  // List SKUs
  if (lower.includes("sku catalog") || lower.includes("my skus") || lower.includes("list sku") || lower.includes("show sku") || lower.includes("my products")) {
    return {
      reply: "📦 Here are your registered SKUs:\n\n• **Tata Salt 1kg** — MRP ₹28 (series_0)\n• **Amul Butter 500g** — MRP ₹280 (series_1)\n• **Maggi Noodles 4-pack** — MRP ₹56 (series_2)\n• **Parle-G Biscuits** — MRP ₹10 (series_3)\n• **Surf Excel 1kg** — MRP ₹195 (series_4)",
      intent: "list_skus",
      data: { skus: [
        { series_id: "series_0", sku_name: "Tata Salt 1kg", mrp: 28 },
        { series_id: "series_1", sku_name: "Amul Butter 500g", mrp: 280 },
        { series_id: "series_2", sku_name: "Maggi Noodles 4-pack", mrp: 56 },
        { series_id: "series_3", sku_name: "Parle-G Biscuits", mrp: 10 },
        { series_id: "series_4", sku_name: "Surf Excel 1kg", mrp: 195 },
      ]},
      suggestedReplies: ["Add a new SKU", "Forecast for Tata Salt 1kg", "Forecast for Amul Butter 500g", "Train model for my store"],
    };
  }

  // Greeting
  if (lower.match(/^(hi|hello|hey|namaste|good\s+(?:morning|afternoon|evening))/)) {
    return {
      reply: "Namaste! 🙏 I'm KiranaIQ Assistant. I can help you add new products, check demand forecasts, and manage your AI training. What would you like to do?",
      intent: "general",
      data: {},
      suggestedReplies: ["Show my SKU catalog", "Add a new SKU", "Check training status", "What can you do?"],
    };
  }

  // Default
  return {
    reply: "I understand you're looking for help! I can assist with adding SKUs, checking forecasts, and managing AI training. Try saying something like \"Add SKU Amul Butter 500g MRP 280\" or \"Forecast for Maggi Noodles\".",
    intent: "general",
    data: {},
    suggestedReplies: ["Show my SKU catalog", "Add a new SKU", "Forecast for Tata Salt", "What can you do?"],
  };
}

// ─── API Function ───────────────────────────────────────────────────────

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  if (!BASE_URL) {
    // Mock mode
    await delay(800 + Math.random() * 1000);
    return mockParseIntent(req.message);
  }

  const { data } = await axios.post<ChatResponse>(`${BASE_URL}/chat`, req);
  return data;
}
