import { create } from "zustand";
import type { AuthUser } from "@/types/auth";
import { clearChatSessionStorage } from "@/lib/chatSessionStorage";

export const AUTH_COOKIE = "yogoda_authenticated";

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  revision: number;
  isReady: boolean;
  setAuth: (accessToken: string, user: AuthUser) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

// Tokens stay in memory. This cookie is a routing hint, never authorization.
export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  revision: 0,
  isReady: false,
  setAuth: (accessToken, user) => {
    document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=31536000; samesite=lax`;
    set((state) => ({
      accessToken,
      user,
      isReady: true,
      revision: state.revision + 1,
    }));
  },
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => {
    clearChatSessionStorage();
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
    try {
      localStorage.removeItem("auth");
    } catch {
      /* Storage may be disabled. */
    }
    set((state) => ({
      accessToken: null,
      user: null,
      isReady: true,
      revision: state.revision + 1,
    }));
  },
}));
