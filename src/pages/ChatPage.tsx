import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Package,
  BarChart3,
  Zap,
  ArrowRight,
  Loader2,
  MessageCircle,
} from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { sendChatMessage, ChatMessage } from "@/services/chatApi";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  { icon: Package, label: "Add SKU Amul Paneer 200g MRP 95" },
  { icon: BarChart3, label: "Forecast for Tata Salt 1kg" },
  { icon: Zap, label: "Train model for my store" },
  { icon: Sparkles, label: "What can you do?" },
];

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <div className="clay-sm px-4 py-3 rounded-2xl rounded-tl-md max-w-[80%]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message, onNavigate }: { message: ChatMessage; onNavigate: (path: string) => void }) {
  const isUser = message.role === "user";
  const redirect = message.data?.redirect as string | undefined;

  // Format reply text — convert **bold** → <strong>
  const formattedContent = message.content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");

  return (
    <div className={cn("flex items-start gap-3 animate-fade-in-up", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
          isUser ? "bg-accent-teal/20" : "bg-primary/20"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-accent-teal" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>
      <div
        className={cn(
          "px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-md"
            : "clay-sm rounded-tl-md text-foreground"
        )}
      >
        <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
        {redirect && !isUser && (
          <button
            onClick={() => onNavigate(redirect)}
            className="flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:underline"
          >
            Go there now <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isLoading) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: msg,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setSuggestedReplies([]);
      setIsLoading(true);

      try {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        const response = await sendChatMessage({
          message: msg,
          userId: user?.userId || "",
          conversationHistory: history,
        });

        const botMessage: ChatMessage = {
          role: "assistant",
          content: response.reply,
          timestamp: Date.now(),
          intent: response.intent,
          data: response.data,
          suggestedReplies: response.suggestedReplies,
        };

        setMessages((prev) => [...prev, botMessage]);
        setSuggestedReplies(response.suggestedReplies || []);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I ran into an error. Please try again in a moment. 🙁",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, messages, user]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Chat messages area */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl px-4 py-6">
          {isEmpty ? (
            /* Welcome state */
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                KiranaIQ Assistant
              </h1>
              <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                Your AI-powered assistant for managing products, forecasts, and training.
                Just type naturally!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {EXAMPLE_PROMPTS.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => handleSend(label)}
                    className="clay-sm px-4 py-3 rounded-xl text-left flex items-center gap-3 transition-all duration-[250ms] hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground leading-snug">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <div className="space-y-4 pb-4">
              {messages.map((msg, i) => (
                <ChatBubble key={i} message={msg} onNavigate={navigate} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Suggested replies + Input bar */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border">
        <div className="container max-w-3xl px-4 pt-2 pb-3">
          {/* Suggested reply chips */}
          {suggestedReplies.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 mb-2 animate-fade-in-up">
              {suggestedReplies.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                    border border-primary/20 text-primary bg-primary/5
                    transition-all duration-[250ms] hover:bg-primary/10 hover:scale-[1.03] active:scale-[0.97]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 clay-sm rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything... e.g. 'Add SKU Amul Butter MRP 280'"
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none py-2 disabled:opacity-50"
            />
            <button
              id="chat-send-button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-[250ms]",
                input.trim() && !isLoading
                  ? "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
            Powered by Amazon Bedrock · Nova Lite
          </p>
        </div>
      </div>
    </div>
  );
}
