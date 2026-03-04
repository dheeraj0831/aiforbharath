import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Lock, Package } from "lucide-react";
import ClayCard from "@/components/ClayCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const { login, loginAsDemo, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{10}$/.test(mobile)) { setError("Enter a valid 10-digit mobile number"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    const ok = await login(mobile, password);
    if (ok) {
      toast({ title: "Welcome back! 👋", description: "You're logged in successfully." });
      navigate("/dashboard");
    } else {
      setError("Invalid credentials. Try demo: 9876543210 / demo123");
    }
  };

  const handleDemo = async () => {
    setError("");
    await loginAsDemo();
    toast({ title: "Demo mode active 🧪", description: "Explore all features freely." });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 clay-sm">
            <Package className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">KiranaIQ</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">Smart stock decisions for your kirana store</p>
        </div>

        <ClayCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="mobile" className="block text-xs text-muted-foreground mb-1.5">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="mobile"
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  disabled={isLoading}
                  placeholder="9876543210"
                  className="w-full clay-inset pl-10 pr-3 py-2.5 rounded-xl text-sm text-foreground bg-bg-elev placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-[250ms]"
                  aria-label="Mobile number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••"
                  className="w-full clay-inset pl-10 pr-3 py-2.5 rounded-xl text-sm text-foreground bg-bg-elev placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-[250ms]"
                  aria-label="Password"
                />
              </div>
            </div>

            {error && <p className="text-accent-red text-xs" role="alert">{error}</p>}

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-border" />
              <span className="text-xs text-muted-foreground">Remember me</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full clay-sm py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all duration-[250ms] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {isLoading ? "Signing in…" : "Login"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-border/50">
            <button
              onClick={handleDemo}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-border/50 transition-all duration-[250ms] hover:scale-[1.02] hover:bg-muted active:scale-[0.98] disabled:opacity-50"
            >
              Continue as Demo User
            </button>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-2">Demo: 9876543210 / demo123</p>
          </div>
        </ClayCard>
      </div>
    </div>
  );
}
