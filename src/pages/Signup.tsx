import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Store, User, Mail, Phone, MapPin, Lock, Package } from "lucide-react";
import ClayCard from "@/components/ClayCard";
import { useToast } from "@/hooks/use-toast";
import { signup } from "@/services/onboardingApi";

export default function Signup() {
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    phone: "",
    city: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.shopName.trim()) e.shopName = "Shop name is required";
    if (!form.ownerName.trim()) e.ownerName = "Owner name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter a valid 10-digit phone";
    if (!form.city.trim()) e.city = "City is required";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await signup(form);
      toast({ title: "Account created! 🎉", description: "Please login with your email." });
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Signup failed";
      setErrors({ submit: msg });
      toast({ title: "Signup failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fields: { key: string; label: string; icon: any; type: string; placeholder: string; maxLength?: number }[] = [
    { key: "shopName", label: "Shop Name", icon: Store, type: "text", placeholder: "Sharma Kirana Store" },
    { key: "ownerName", label: "Owner Name", icon: User, type: "text", placeholder: "Rajesh Sharma" },
    { key: "email", label: "Email", icon: Mail, type: "email", placeholder: "rajesh@example.com" },
    { key: "phone", label: "Phone Number", icon: Phone, type: "tel", placeholder: "9876543210", maxLength: 10 },
    { key: "city", label: "City", icon: MapPin, type: "text", placeholder: "Mumbai" },
    { key: "password", label: "Password", icon: Lock, type: "password", placeholder: "••••••" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 clay-sm">
            <Package className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Join KiranaIQ</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Set up your shop for AI-powered insights
          </p>
        </div>

        <ClayCard>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {fields.map(({ key, label, icon: Icon, type, placeholder, maxLength }) => (
              <div key={key}>
                <label htmlFor={key} className="block text-xs text-muted-foreground mb-1.5">
                  {label}
                </label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id={key}
                    type={type}
                    value={(form as any)[key]}
                    onChange={set(key)}
                    disabled={isLoading}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className="w-full clay-inset pl-10 pr-3 py-2.5 rounded-xl text-sm text-foreground bg-bg-elev placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-[250ms]"
                    aria-label={label}
                  />
                </div>
                {errors[key] && <p className="text-accent-red text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}

            {errors.submit && <p className="text-accent-red text-xs" role="alert">{errors.submit}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full clay-sm py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all duration-[250ms] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {isLoading ? "Creating Account…" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/" className="text-primary font-medium hover:underline">
                Login
              </Link>
            </p>
          </div>
        </ClayCard>
      </div>
    </div>
  );
}
