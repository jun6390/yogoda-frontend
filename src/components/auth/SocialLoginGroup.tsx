"use client";

import { SocialLoginButton } from "@/components/auth/SocialLoginButton";
import type { SocialProvider } from "@/types/auth";

const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
const NAVER_AUTH_URL = "https://nid.naver.com/oauth2.0/authorize";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const OAUTH_STATE_STORAGE_KEY = "oauth_state";

interface SocialLoginGroupProps {
  labels: Record<SocialProvider, string>;
}

export function SocialLoginGroup({ labels }: SocialLoginGroupProps) {
  const handleKakaoLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;

    if (!clientId) {
      console.error("NEXT_PUBLIC_KAKAO_CLIENT_ID가 설정되지 않았어요.");
      return;
    }

    const authorizeUrl = new URL(KAKAO_AUTH_URL);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set(
      "redirect_uri",
      `${window.location.origin}/auth/kakao/callback`,
    );
    authorizeUrl.searchParams.set("response_type", "code");

    window.location.href = authorizeUrl.toString();
  };

  const handleNaverLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;

    if (!clientId) {
      console.error("NEXT_PUBLIC_NAVER_CLIENT_ID가 설정되지 않았어요.");
      return;
    }

    const state = crypto.randomUUID();
    sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY, state);

    const authorizeUrl = new URL(NAVER_AUTH_URL);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set(
      "redirect_uri",
      `${window.location.origin}/auth/naver/callback`,
    );
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("state", state);

    window.location.href = authorizeUrl.toString();
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID가 설정되지 않았어요.");
      return;
    }

    const state = crypto.randomUUID();
    sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY, state);

    const authorizeUrl = new URL(GOOGLE_AUTH_URL);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set(
      "redirect_uri",
      `${window.location.origin}/auth/google/callback`,
    );
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", "email profile");
    authorizeUrl.searchParams.set("state", state);

    window.location.href = authorizeUrl.toString();
  };

  return (
    <div className="flex flex-col gap-md">
      <SocialLoginButton
        provider="google"
        label={labels.google}
        onClick={handleGoogleLogin}
      />
      <SocialLoginButton
        provider="naver"
        label={labels.naver}
        onClick={handleNaverLogin}
      />
      <SocialLoginButton
        provider="kakao"
        label={labels.kakao}
        onClick={handleKakaoLogin}
      />
    </div>
  );
}
