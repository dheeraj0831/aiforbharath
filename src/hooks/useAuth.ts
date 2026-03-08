import { useState, useEffect, useCallback } from "react";

const AUTH_KEY = "kirana_auth_token";
const USER_KEY = "kirana_user";

export interface ShopUser {
  userId: string;
  shopName: string;
  ownerName: string;
  email: string;
  trainingStatus: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !!localStorage.getItem(AUTH_KEY)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<ShopUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem(AUTH_KEY));
    const stored = localStorage.getItem(USER_KEY);
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Existing mobile + password login (mock)
  const login = useCallback(async (mobile: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    if (mobile.length === 10 && password.length >= 6) {
      localStorage.setItem(AUTH_KEY, "mock-jwt-token-" + Date.now());
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  }, []);

  // New email + password login (calls API via onboardingApi)
  const loginWithEmail = useCallback(async (userData: ShopUser): Promise<boolean> => {
    localStorage.setItem(AUTH_KEY, "jwt-" + Date.now());
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return true;
  }, []);

  const loginAsDemo = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    localStorage.setItem(AUTH_KEY, "demo-token-" + Date.now());
    setIsAuthenticated(true);
    setIsLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return { isAuthenticated, isLoading, user, login, loginWithEmail, loginAsDemo, logout };
}
