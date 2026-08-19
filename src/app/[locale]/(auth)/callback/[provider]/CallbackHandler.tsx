"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { ApiError } from "@/lib/api/client";
import { loginWithKakao } from "@/lib/api/auth";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import type { SocialProvider } from "@/types/auth";

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

  const { mutate, error } = useMutation({
    mutationFn: (authCode: string) => loginWithKakao(authCode),
    onSuccess: ({ accessToken, userId, name, isNewUser, role }) => {
      setAuth(accessToken, { userId, name, isNewUser, role });
      router.replace("/");
    },
  });

  useEffect(() => {
    if (requestedRef.current || provider !== "kakao" || !code) {
      return;
    }

    requestedRef.current = true;
    mutate(code);
  }, [code, mutate, provider]);

  if (provider !== "kakao") {
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
