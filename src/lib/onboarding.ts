const ONBOARDING_COOKIE = "yogoda_onboarding_completed";

/*
 * 스플래시 → 온보딩 → 권한 → 페르소나 진입 과정을 모두 마친 사용자임을 기록함
 * proxy.ts에서도 읽을 수 있도록 cookie에 저장함
 */
export function completeOnboarding() {
  document.cookie = `${ONBOARDING_COOKIE}=true; path=/; max-age=31536000; samesite=lax`;
}
