"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearTokens, getTokens, setTokens, ApiError } from "@/lib/api";

interface ScoutUser {
  id: number;
  full_name: string;
  email: string | null;
  phone: string;
  user_type: string;
}

interface AuthResponse {
  user: ScoutUser;
  tokens: { access: string; refresh: string };
}

interface AuthContextValue {
  user: ScoutUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ScoutUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { access } = getTokens();
    if (!access) {
      // One-time mount check: no token means there's nothing to await.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    apiRequest<ScoutUser>("/auth/me/")
      .then(setUser)
      // Only a real auth rejection ends the session; a network failure (e.g.
      // opening the installed app offline) must not wipe the stored tokens.
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) clearTokens();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<AuthResponse>("/auth/scout/login/", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setTokens(data.tokens.access, data.tokens.refresh);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Redirects to /login if there's no authenticated user once the initial auth check settles. */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  return { user, loading };
}

export { ApiError };
