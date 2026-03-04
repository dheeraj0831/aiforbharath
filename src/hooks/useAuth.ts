import { useState, useEffect, useCallback } from "react";

const AUTH_KEY = "kirana_auth_token";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !!localStorage.getItem(AUTH_KEY)
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem(AUTH_KEY));
  }, []);

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
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, isLoading, login, loginAsDemo, logout };
}
