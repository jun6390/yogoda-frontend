const CHAT_SESSION_KEYS = [
  "preselectedPlan",
  "preselectedPlanBenefits",
  "signupStep",
  "signupCollectedData",
  "signupQuickReplies",
  "signupEntryShown",
  "signupKickoffSent",
  "chatQuickReplies",
  "termsAgreementChecked",
] as const;

export function clearChatSessionStorage() {
  if (typeof window === "undefined") return;

  try {
    for (const key of CHAT_SESSION_KEYS) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // sessionStorage가 차단된 환경에서도 로그아웃과 채팅 종료는 계속 진행합니다.
  }
}
