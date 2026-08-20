import { apiFetch } from "@/lib/api/client";
import type { SocialLoginResponse } from "@/types/auth";

export function loginWithKakao(code: string) {
  return apiFetch<SocialLoginResponse>("/api/auth/kakao", {
    method: "POST",
    body: { code },
  });
}

export function loginWithNaver(code: string) {
  return apiFetch<SocialLoginResponse>("/api/auth/naver", {
    method: "POST",
    body: { code },
  });
}

export function loginWithGoogle(code: string) {
  return apiFetch<SocialLoginResponse>("/api/auth/google", {
    method: "POST",
    body: { code },
  });
}

export function logout() {
  return apiFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}
