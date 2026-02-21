import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { mockApi } from "@/lib/mock-data";

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("brsr_token"));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem("brsr_email"));

  useEffect(() => {
    const token = localStorage.getItem("brsr_token");
    if (token) {
      setIsAuthenticated(true);
      setUserEmail(localStorage.getItem("brsr_email"));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await mockApi.login(email, password);
    localStorage.setItem("brsr_token", res.token);
    localStorage.setItem("brsr_email", email);
    setIsAuthenticated(true);
    setUserEmail(email);
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    await mockApi.signup(email, password);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("brsr_token");
    localStorage.removeItem("brsr_email");
    setIsAuthenticated(false);
    setUserEmail(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
