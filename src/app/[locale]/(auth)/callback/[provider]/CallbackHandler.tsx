"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { ApiError } from "@/lib/api/client";
import {
  loginWithGoogle,
  loginWithKakao,
  loginWithNaver,
} from "@/lib/api/auth";
import { importGuestChatSession } from "@/lib/api/chat";
import { PageContainer } from "@/components/layout/PageContainer";
import { Spinner } from "@/components/ui/Spinner/Spinner";
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
      // API 응답과 무관하게 실제 OAuth 콜백 경로의 제공자를 인증 상태에 보관함
      setAuth(accessToken, { userId, name, isNewUser, role, provider });

      // 비회원(게스트) 상태에서 나눈 대화가 있으면 방금 로그인한 회원 세션으로 이관함
      // 서버가 게스트 세션도 실시간 저장해두므로, sessionId만 넘기면 됨
      const guestSessionId = useChatHistoryStore.getState().sessionId;

      if (guestSessionId) {
        try {
          // sessionId가 만료됐거나 찾을 수 없어도 서버는 예외 없이 { session: null }로
          // 응답함(정상적인 실패 케이스). catch는 네트워크 에러 등 진짜 예외 상황 대비용
          await importGuestChatSession({ sessionId: guestSessionId });
        } catch (err) {
          console.error("게스트 대화 내역 이관 실패:", err);
        }
      }

      // 로그인 후에는 게스트 세션 이관 여부와 무관하게 항상 로컬 채팅 데이터를 삭제함
      // (다른 사용자가 같은 기기에서 로그인할 때 이전 게스트 데이터가 노출되는 것을 방지)
      useChatHistoryStore.getState().clearMessages();

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

  const message = !loginFn
    ? t("unsupportedProvider")
    : !code
      ? t("invalidAccess")
      : error
        ? error instanceof ApiError
          ? error.message
          : t("authFailed")
        : t("processing");
  const isLoading = Boolean(loginFn && code && !error);

  return (
    <PageContainer className="relative flex min-h-full flex-col items-center justify-center overflow-hidden py-5xl text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[6%] left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-glow-accent opacity-80 blur-3xl"
      />

      <div className="relative flex flex-col items-center">
        <div
          className={
            isLoading
              ? "motion-safe:animate-[float404_3.2s_ease-in-out_infinite]"
              : ""
          }
        >
          <Image
            src="/yogoda-characters/login.webp"
            alt=""
            width={220}
            height={247}
            className="h-[247px] w-[220px] object-contain drop-shadow-[0_10px_14px_rgba(224,20,133,0.16)]"
            priority
          />
        </div>

        <div className="mt-xl flex items-center gap-sm">
          {isLoading && (
            <Spinner
              size="md"
              className="text-action-primary"
              label={message}
            />
          )}
          <p className="font-sans text-body-14-regular text-text-secondary">
            {message}
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
