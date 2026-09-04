import type { LatestSessionResponse } from "@/lib/api/chat";
import type { ChatMessage } from "@/types/chat";

export function restoreChatMessages(
  messages: LatestSessionResponse["messages"],
): ChatMessage[] {
  return messages.flatMap((m) => {
    // 카드 타입 메시지 — 텍스트 없이 카드만 렌더링
    if (m.messageType === "fraud_warning") {
      return [
        {
          id: m.id,
          sender: "ai" as const,
          type: "fraud_warning" as const,
          signupStep: "fraud_warning",
          signupData: {},
        },
      ] satisfies ChatMessage[];
    }
    if (m.messageType === "terms") {
      return [
        {
          id: m.id,
          sender: "ai" as const,
          type: "terms" as const,
          signupStep: "terms_agreement",
          signupData: {},
        },
      ] satisfies ChatMessage[];
    }
    if (m.messageType === "identity_verification") {
      return [
        {
          id: m.id,
          sender: "ai" as const,
          type: "identity_verification" as const,
          signupStep: "identity_verification",
          signupData: {},
        },
      ] satisfies ChatMessage[];
    }
    if (m.messageType === "signup_summary") {
      return [
        {
          id: m.id,
          sender: "ai" as const,
          type: "signup_summary" as const,
          signupStep: "final_confirm",
          signupData:
            (m.signupData as import("@/types/chat").SignupCollectedData) ?? {},
          preselectedPlan: m.preselectedPlan as
            import("@/types/chat").PreselectedPlan | undefined,
        },
      ] satisfies ChatMessage[];
    }
    if (m.messageType === "signup_complete") {
      return [
        {
          id: m.id,
          sender: "ai" as const,
          type: "signup_complete" as const,
          signupStep: "completed" as const,
          preselectedPlan: m.preselectedPlan as
            import("@/types/chat").PreselectedPlan | undefined,
        },
      ] satisfies ChatMessage[];
    }

    // 내용이 빈 문자열(또는 공백뿐)이면 빈 말풍선을 만들지 않음.
    // 스트리밍 중 리크 필터가 응답 전체를 걸러내는 등의 이유로
    // DB에 빈 문자열로 저장된 메시지가 있을 수 있음
    const trimmedContent = m.content.trim();
    const textMsg: ChatMessage | null = trimmedContent
      ? {
          id: m.id,
          sender: m.role === "user" ? "user" : "ai",
          type: "text",
          text: m.content,
        }
      : null;

    // 요금제 추천 카드가 저장된 메시지는, 실시간 대화 때와 동일하게
    // 텍스트 말풍선 뒤에 카드 메시지를 이어붙여 함께 복원함
    if (m.plans && m.plans.length > 0) {
      const plansMsg: ChatMessage = {
        id: `${m.id}-plans`,
        sender: "ai",
        type: "plans",
        plans: m.plans,
      };
      return textMsg ? [textMsg, plansMsg] : [plansMsg];
    }

    return textMsg ? [textMsg] : [];
  });
}
