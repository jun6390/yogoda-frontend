import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthUser } from "@/types/auth";
import { clearChatSessionStorage } from "@/lib/chatSessionStorage";

const AUTH_COOKIE = "yogoda_authenticated";

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;

  setAuth: (accessToken: string, user: AuthUser) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,

      setAuth: (accessToken, user) => {
        /*
         * accessToken 자체는 localStorage에만 두고, proxy.ts가 로그인 여부를
         * 판단할 수 있도록 값 없는 플래그 쿠키만 별도로 세팅함
         */
        document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=31536000; samesite=lax`;

        set({
          accessToken,
          user,
        });
      },

      setAccessToken: (accessToken) => {
        set({
          accessToken,
        });
      },

      clearAuth: () => {
        clearChatSessionStorage();
        document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;

        set({
          accessToken: null,
          user: null,
        });
      },
    }),
    {
      name: "auth",
    },
  ),
);
