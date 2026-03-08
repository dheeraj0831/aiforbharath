import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
  BarChart3,
  TrendingUp,
  Package,
  LogOut,
} from "lucide-react";
import ClayCard from "@/components/ClayCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  uploadSalesData,
  getTrainingStatus,
  getTemplateDownloadUrl,
} from "@/services/onboardingApi";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; step: number }> = {
  NOT_STARTED: { label: "Not Started", color: "text-muted-foreground", icon: Clock, step: 0 },
  UPLOADED: { label: "Data Uploaded", color: "text-accent-yellow", icon: FileSpreadsheet, step: 1 },
  TRAINING: { label: "Training AI…", color: "text-accent-purple", icon: Loader2, step: 2 },
  READY: { label: "Insights Ready!", color: "text-accent-green", icon: CheckCircle2, step: 3 },
};

export default function ShopDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [status, setStatus] = useState(user?.trainingStatus || "NOT_STARTED");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = user?.userId || "";

  // Poll training status when in UPLOADED or TRAINING
  const pollStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getTrainingStatus(userId);
      setStatus(res.trainingStatus);
      if (res.trainingStatus === "READY") {
        if (pollingRef.current) clearInterval(pollingRef.current);
        toast({ title: "🎉 Training Complete!", description: "Your AI insights are ready." });
      }
    } catch {
      /* silent */
    }
  }, [userId, toast]);

  useEffect(() => {
    if (status === "UPLOADED" || status === "TRAINING") {
      pollingRef.current = setInterval(pollStatus, 3000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status, pollStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast({ title: "Invalid file", description: "Please upload an Excel file (.xlsx)", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) return;
    setUploading(true);
    try {
      const res = await uploadSalesData(userId, selectedFile);
      setStatus(res.trainingStatus);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "Upload successful! 📊", description: "AI training has started." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_STARTED;
  const StatusIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-foreground text-sm">KiranaIQ</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user?.shopName || "My Shop"}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl transition-all duration-[250ms] hover:scale-110 hover:bg-muted"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {user?.ownerName || "Shop Owner"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get AI-powered sales insights for <strong className="text-foreground">{user?.shopName || "your shop"}</strong>
          </p>
        </div>

        {/* Training Status */}
        <ClayCard className="mb-5 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Onboarding Progress
          </h2>
          <div className="flex items-center gap-4 mb-4">
            {[0, 1, 2, 3].map((step) => (
              <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    step <= cfg.step
                      ? "bg-primary/20 text-primary scale-100"
                      : "bg-muted text-muted-foreground scale-90 opacity-50"
                  } ${step === cfg.step && status === "TRAINING" ? "animate-pulse" : ""}`}
                >
                  {step === 0 && <FileSpreadsheet className="w-4 h-4" />}
                  {step === 1 && <Upload className="w-4 h-4" />}
                  {step === 2 && <Sparkles className="w-4 h-4" />}
                  {step === 3 && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-medium ${step <= cfg.step ? "text-foreground" : "text-muted-foreground/50"}`}>
                  {["Template", "Upload", "Training", "Ready"][step]}
                </span>
                {step < 3 && (
                  <div className={`hidden sm:block absolute w-8 h-0.5 ${step < cfg.step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl clay-inset ${cfg.color}`}>
            <StatusIcon className={`w-4 h-4 ${status === "TRAINING" ? "animate-spin" : ""}`} />
            <span className="text-sm font-medium">{cfg.label}</span>
          </div>
        </ClayCard>

        {/* Step 1: Download Template */}
        <ClayCard className="mb-5 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-teal/20 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-accent-teal" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1">1. Download Sales Template</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Download the Excel template, fill it with your sales data (date, product, units sold, price, etc.)
              </p>
              <a
                href={getTemplateDownloadUrl()}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 clay-sm px-4 py-2.5 rounded-xl text-sm font-medium text-primary transition-all duration-[250ms] hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Download Template
              </a>
            </div>
          </div>
        </ClayCard>

        {/* Step 2: Upload Sales Data */}
        <ClayCard className="mb-5 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-accent-purple" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1">2. Upload Sales Data</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Upload your filled Excel file to start AI training
              </p>

              {status === "READY" ? (
                <div className="flex items-center gap-2 text-accent-green text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Data already processed</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <label
                    htmlFor="salesFile"
                    className="flex items-center gap-3 clay-inset px-4 py-3 rounded-xl cursor-pointer transition-all duration-[250ms] hover:ring-2 hover:ring-primary/30"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground flex-1 truncate">
                      {selectedFile ? selectedFile.name : "Choose Excel file…"}
                    </span>
                    <input
                      ref={fileInputRef}
                      id="salesFile"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      disabled={uploading || status === "TRAINING"}
                      className="sr-only"
                    />
                  </label>

                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading || status === "TRAINING"}
                    className="w-full clay-sm py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-[250ms] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload &amp; Start Training
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </ClayCard>

        {/* Step 3: Insights (shown when READY) */}
        {status === "READY" && (
          <ClayCard className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-green/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-accent-green" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">3. Your Insights Are Ready!</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Explore AI-powered demand forecasts and pricing suggestions
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    { icon: BarChart3, label: "Demand Forecasts", color: "text-accent-teal" },
                    { icon: TrendingUp, label: "Price Optimization", color: "text-accent-purple" },
                    { icon: Package, label: "Product Insights", color: "text-accent-yellow" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="clay-inset p-3 rounded-xl flex flex-col items-center gap-2 text-center">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <span className="text-xs font-medium text-foreground">{label}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full clay-sm py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-[250ms] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <BarChart3 className="w-4 h-4" />
                  Go to Dashboard
                </button>
              </div>
            </div>
          </ClayCard>
        )}
      </main>
    </div>
  );
}
