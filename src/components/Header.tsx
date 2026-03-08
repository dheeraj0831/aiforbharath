import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Info, Package, Moon, Sun, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme.tsx";
import { cn } from "@/lib/utils";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container flex items-center justify-between h-14 px-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 transition-all duration-[250ms] hover:scale-105"
          aria-label="Go to dashboard"
        >
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-foreground text-sm">KiranaIQ</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all duration-[250ms] hover:scale-110 hover:bg-muted"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          <button
            onClick={() => navigate("/about")}
            className={cn(
              "p-2 rounded-xl transition-all duration-[250ms] hover:scale-110 hover:bg-muted",
              location.pathname === "/about" && "bg-muted"
            )}
            aria-label="About"
          >
            <Info className="w-4 h-4 text-muted-foreground" />
          </button>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl transition-all duration-[250ms] hover:scale-110 hover:bg-muted"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
