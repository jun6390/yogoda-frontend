"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { ApiError } from "@/lib/api/client";
import { loginWithKakao, loginWithNaver } from "@/lib/api/auth";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import type { SocialLoginResponse, SocialProvider } from "@/types/auth";

const NAVER_STATE_STORAGE_KEY = "naver_oauth_state";

const loginFns: Partial<
  Record<SocialProvider, (code: string) => Promise<SocialLoginResponse>>
> = {
  kakao: loginWithKakao,
  naver: loginWithNaver,
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
      if (provider === "naver") {
        const savedState = sessionStorage.getItem(NAVER_STATE_STORAGE_KEY);
        sessionStorage.removeItem(NAVER_STATE_STORAGE_KEY);

        if (!savedState || savedState !== state) {
          return Promise.reject(new Error(t("authFailed")));
        }
      }

      return loginFn!(authCode);
    },
    onSuccess: ({ accessToken, userId, name, isNewUser, role }) => {
      setAuth(accessToken, { userId, name, isNewUser, role });
      router.replace("/");
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
