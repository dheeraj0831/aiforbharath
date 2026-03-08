import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Phone, Lock, Mail, Package } from "lucide-react";
import ClayCard from "@/components/ClayCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { loginUser } from "@/services/onboardingApi";

type LoginMode = "email" | "mobile";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const { login, loginWithEmail, loginAsDemo, isLoading } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loading = isLoading || localLoading;

  const handleMobileLogin = async (e: React.FormEvent) => {
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLocalLoading(true);
    try {
      const userData = await loginUser({ email, password });
      await loginWithEmail(userData);
      toast({ title: "Welcome back! 👋", description: `Logged in as ${userData.shopName}` });
      navigate("/shop-dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Login failed";
      setError(msg + ". Try demo: demo@kirana.com / demo123");
    } finally {
      setLocalLoading(false);
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
          {/* Login mode tabs */}
          {/* <div className="flex gap-1 p-1 clay-inset rounded-xl mb-4">
            <button
              type="button"
              onClick={() => { setMode("email"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-[250ms] ${
                mode === "email"
                  ? "bg-primary text-primary-foreground clay-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="w-3.5 h-3.5 inline mr-1.5" />
              Email
            </button>
            <button
              type="button"
              onClick={() => { setMode("mobile"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-[250ms] ${
                mode === "mobile"
                  ? "bg-primary text-primary-foreground clay-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="w-3.5 h-3.5 inline mr-1.5" />
              Mobile
            </button>
          </div> */}

          {/* Email login form */}
        
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs text-muted-foreground mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="you@example.com"
                    className="w-full clay-inset pl-10 pr-3 py-2.5 rounded-xl text-sm text-foreground bg-bg-elev placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-[250ms]"
                    aria-label="Email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="emailPassword" className="block text-xs text-muted-foreground mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="emailPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
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
                disabled={loading}
                className="w-full clay-sm py-3 rounded-xl hover:bg-primary/10 hover:scale-[1.03] active:scale-[0.97] border-primary/20 text-primary bg-primary/5 font-semibold text-sm transition-all duration-[250ms] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {loading ? "Signing in…" : "Login"}
              </button>
            </form>
      

        
          {/* Demo & Signup links */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <button
              onClick={handleDemo}
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-border/50 transition-all duration-[250ms] hover:scale-[1.02] hover:bg-muted active:scale-[0.98] disabled:opacity-50"
            >
              Continue as Demo User
            </button>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-2">Demo: 9876543210 / demo123</p>

            <p className="text-sm text-muted-foreground text-center mt-3">
              New shop owner?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </ClayCard>
      </div>
    </div>
  );
}
