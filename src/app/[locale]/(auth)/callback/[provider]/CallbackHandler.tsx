"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { ApiError } from "@/lib/api/client";
import {
  loginWithGoogle,
  loginWithKakao,
  loginWithNaver,
} from "@/lib/api/auth";
import { importGuestChatSession } from "@/lib/api/chat";
import { useRouter } from "@/i18n/navigation";
import { LOGIN_REDIRECT_STORAGE_KEY } from "@/lib/auth/loginRedirect";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatHistoryStore } from "@/stores/chatHistoryStore";
import type { SocialLoginResponse, SocialProvider } from "@/types/auth";

const OAUTH_STATE_STORAGE_KEY = "oauth_state";
const STATE_VERIFIED_PROVIDERS: SocialProvider[] = ["naver", "google"];

const loginFns: Partial<
  Record<SocialProvider, (code: string) => Promise<SocialLoginResponse>>
> = {
  kakao: loginWithKakao,
  naver: loginWithNaver,
  google: loginWithGoogle,
};

interface CallbackHandlerProps {
  provider: SocialProvider;
}

export function CallbackHandler({ provider }: CallbackHandlerProps) {
  const t = useTranslations("Callback");
  const searchParams = useSearchParams();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const requestedRef = useRef(false);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const loginFn = loginFns[provider];

  const { mutate, error } = useMutation({
    mutationFn: (authCode: string) => {
      if (STATE_VERIFIED_PROVIDERS.includes(provider)) {
        const savedState = sessionStorage.getItem(OAUTH_STATE_STORAGE_KEY);
        sessionStorage.removeItem(OAUTH_STATE_STORAGE_KEY);

        if (!savedState || savedState !== state) {
          return Promise.reject(new Error(t("authFailed")));
        }
      }

      return loginFn!(authCode);
    },
    onSuccess: async ({ accessToken, userId, name, isNewUser, role }) => {
      setAuth(accessToken, { userId, name, isNewUser, role });

      // 비회원(게스트) 상태에서 나눈 대화가 있으면 방금 로그인한 회원 세션으로 이관함
      const guestHistory = useChatHistoryStore.getState();
      const guestMessages = guestHistory.messages
        .filter((m) => m.type === "text" && m.text && m.id !== "welcome")
        .map((m) => ({
          role: (m.sender === "user" ? "user" : "admin") as "user" | "admin",
          content: m.text!,
        }));

      if (guestMessages.length > 0) {
        try {
          await importGuestChatSession({
            messages: guestMessages,
            collectedInfo: guestHistory.collectedInfo ?? undefined,
            lastInteractionId: guestHistory.lastInteractionId ?? undefined,
          });
        } catch (err) {
          console.error("게스트 대화 내역 이관 실패:", err);
        } finally {
          guestHistory.clearMessages();
        }
      }

      // AI 채팅 화면에서 로그인하러 온 경우에만 그 화면으로 되돌아가고,
      // 그 외에는 기존과 동일하게 홈으로 이동함
      const redirectPath = sessionStorage.getItem(LOGIN_REDIRECT_STORAGE_KEY);
      sessionStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY);

      router.replace(redirectPath === "/ai" ? "/ai" : "/");
    },
  });

  useEffect(() => {
    if (requestedRef.current || !loginFn || !code) {
      return;
    }

    requestedRef.current = true;
    mutate(code);
  }, [code, loginFn, mutate]);

  if (!loginFn) {
    return <div>{t("unsupportedProvider")}</div>;
  }

  if (!code) {
    return <div>{t("invalidAccess")}</div>;
  }

  if (error) {
    const message = error instanceof ApiError ? error.message : t("authFailed");

    return <div>{message}</div>;
  }

  return <div>{t("processing")}</div>;
}
