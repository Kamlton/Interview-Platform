import axios from "axios";

const TOKEN_KEY = "ip_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const REFRESH_KEY = "ip_refresh";
export const refreshStore = {
  get: () => localStorage.getItem(REFRESH_KEY),
  set: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  clear: () => localStorage.removeItem(REFRESH_KEY),
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const rt = refreshStore.get();
  if (!rt) return null;
  try {
    const base = import.meta.env.VITE_API_BASE || "";
    const res = await axios.post(`${base}/api/auth/refresh`, { refreshToken: rt });
    tokenStore.set(res.data.token);
    refreshStore.set(res.data.refreshToken);
    return res.data.token as string;
  } catch {
    return null;
  }
}

function forceLogout() {
  tokenStore.clear();
  refreshStore.clear();
  localStorage.removeItem("ip_profile");
  if (!location.pathname.startsWith("/login")) location.assign("/login");
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;
    const url: string = original?.url || "";
    const isAuthCall = url.includes("/api/auth/");

    if (status === 401 && original && !isAuthCall && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = doRefresh();
        refreshing.finally(() => { refreshing = null; });
      }
      const newToken = await refreshing;
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      forceLogout();
    }
    return Promise.reject(error);
  }
);

export function apiError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    return e.response?.data?.detail || e.response?.data?.message || e.message;
  }
  return e instanceof Error ? e.message : "Неизвестная ошибка";
}

export function userIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return (
      payload["nameid"] ||
      payload["sub"] ||
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
      null
    );
  } catch {
    return null;
  }
}
