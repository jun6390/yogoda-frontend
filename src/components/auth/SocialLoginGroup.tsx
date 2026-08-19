"use client";

import { SocialLoginButton } from "@/components/auth/SocialLoginButton";
import type { SocialProvider } from "@/types/auth";

const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";

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

  return (
    <div className="flex flex-col gap-md">
      <SocialLoginButton provider="google" label={labels.google} />
      <SocialLoginButton provider="naver" label={labels.naver} />
      <SocialLoginButton
        provider="kakao"
        label={labels.kakao}
        onClick={handleKakaoLogin}
      />
    </div>
  );
}
