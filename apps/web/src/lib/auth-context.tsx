"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

const SESSION_KEY = "glacier_user";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  currentBalance: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  updateBalance: (balance: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore from sessionStorage, then verify with server
  useEffect(() => {
    const init = async () => {
      // Restore cached user immediately to avoid flash
      try {
        const cached = sessionStorage.getItem(SESSION_KEY);
        if (cached) setUser(JSON.parse(cached));
      } catch {}

      // Verify session is still valid with server
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
        } else {
          // Cookie expired or invalid — clear local state
          setUser(null);
          sessionStorage.removeItem(SESSION_KEY);
        }
      } catch {
        // Network error — keep cached data if available
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback((userData: AuthUser) => {
    setUser(userData);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
    router.push("/");
  }, [router]);

  const updateBalance = useCallback((balance: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, currentBalance: balance };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
