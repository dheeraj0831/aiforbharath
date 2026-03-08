import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function FloatingChatButton() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated || location.pathname === "/chat" || location.pathname === "/" || location.pathname === "/signup") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative group">
        <div className="absolute -inset-1 bg-primary/40 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
        <button
          onClick={() => navigate("/chat")}
          className="relative flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 animate-bounce"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
