import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as backend from "@/lib/backend";
import { clearDocumentStore } from "@/lib/document-store";

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
    const resp = await backend.login({ email, password });
    const data = resp?.data ?? resp;

    const token = data?.token ?? data?.access_token ?? data?.data?.token ?? data?.data?.access_token;

    if (token) {
      localStorage.setItem("brsr_token", token);
      localStorage.setItem("brsr_email", data?.email ?? email);
      setIsAuthenticated(true);
      setUserEmail(data?.email ?? email);
      return;
    }

    // If backend uses cookie-based sessions and returned 200 OK, consider login successful
    if (resp && (resp.status === 200 || resp.status === 201)) {
      localStorage.removeItem("brsr_token");
      localStorage.setItem("brsr_email", data?.email ?? email);
      setIsAuthenticated(true);
      setUserEmail(data?.email ?? email);
      return;
    }

    throw new Error("Login failed: no token returned");
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    await backend.register({ email, password });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("brsr_token");
    localStorage.removeItem("brsr_email");
    clearDocumentStore();
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
