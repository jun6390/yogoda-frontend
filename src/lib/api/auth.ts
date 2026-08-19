import { apiFetch } from "@/lib/api/client";
import type { KakaoLoginResponse } from "@/types/auth";

export function loginWithKakao(code: string) {
  return apiFetch<KakaoLoginResponse>("/api/auth/kakao", {
    method: "POST",
    body: { code },
  });
}
