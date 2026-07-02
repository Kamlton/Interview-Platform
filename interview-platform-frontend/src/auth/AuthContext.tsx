import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api";
import { tokenStore, refreshStore, userIdFromToken } from "../api/client";
import type { Role } from "../types";

const PROFILE_KEY = "ip_profile";

interface Profile { userId: string | null; fullName: string; role: Role; }
interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  fullName: string | null;
  role: Role | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function readProfile(): Profile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? (JSON.parse(raw) as Profile) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(
    tokenStore.get() ? readProfile() : null
  );

  const value = useMemo<AuthState>(() => ({
    isAuthenticated: !!profile,
    userId: profile?.userId ?? null,
    fullName: profile?.fullName ?? null,
    role: profile?.role ?? null,
    hasRole: (...roles: Role[]) => !!profile && roles.includes(profile.role),
    login: async (email, password) => {
      const res = await authApi.login(email, password);
      tokenStore.set(res.token);
      refreshStore.set(res.refreshToken);
      const p: Profile = { userId: userIdFromToken(res.token), fullName: res.fullName, role: res.role };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      setProfile(p);
    },
    logout: () => {
      const rt = refreshStore.get();
      if (rt) authApi.logout(rt).catch(() => {});   // отзыв на сервере
      tokenStore.clear();
      refreshStore.clear();
      localStorage.removeItem(PROFILE_KEY);
      setProfile(null);
    },
  }), [profile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен использоваться внутри AuthProvider");
  return ctx;
}
