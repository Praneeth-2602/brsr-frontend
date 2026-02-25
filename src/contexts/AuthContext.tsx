import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as backend from "@/lib/backend";
import { clearDocumentStore } from "@/lib/document-store";

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  userName: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("brsr_token"));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem("brsr_email"));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem("brsr_name"));

  useEffect(() => {
    const token = localStorage.getItem("brsr_token");
    if (token) {
      setIsAuthenticated(true);
      setUserEmail(localStorage.getItem("brsr_email"));
      setUserName(localStorage.getItem("brsr_name"));
    }
  }, []);

  const resolveAuthIdentity = useCallback((data: any, fallbackEmail?: string) => {
    const email =
      data?.user?.email ??
      data?.data?.user?.email ??
      data?.email ??
      data?.data?.email ??
      fallbackEmail ??
      null;

    const name =
      data?.user?.name ??
      data?.data?.user?.name ??
      data?.name ??
      data?.data?.name ??
      null;

    return { email, name };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const resp = await backend.login({ email, password });
    const data = resp?.data ?? resp;

    const token = data?.token ?? data?.access_token ?? data?.data?.token ?? data?.data?.access_token;
    const identity = resolveAuthIdentity(data, email);

    if (token) {
      localStorage.setItem("brsr_token", token);
      if (identity.email) localStorage.setItem("brsr_email", identity.email);
      else localStorage.setItem("brsr_email", email);
      if (identity.name) localStorage.setItem("brsr_name", identity.name);
      else localStorage.removeItem("brsr_name");
      setIsAuthenticated(true);
      setUserEmail(identity.email ?? email);
      setUserName(identity.name);
      return;
    }

    // If backend uses cookie-based sessions and returned 200 OK, consider login successful
    if (resp && (resp.status === 200 || resp.status === 201)) {
      localStorage.removeItem("brsr_token");
      if (identity.email) localStorage.setItem("brsr_email", identity.email);
      else localStorage.setItem("brsr_email", email);
      if (identity.name) localStorage.setItem("brsr_name", identity.name);
      else localStorage.removeItem("brsr_name");
      setIsAuthenticated(true);
      setUserEmail(identity.email ?? email);
      setUserName(identity.name);
      return;
    }

    throw new Error("Login failed: no token returned");
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await backend.register({ name, email, password });
  }, [resolveAuthIdentity]);

  const logout = useCallback(() => {
    localStorage.removeItem("brsr_token");
    localStorage.removeItem("brsr_email");
    localStorage.removeItem("brsr_name");
    clearDocumentStore();
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserName(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, userName, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
