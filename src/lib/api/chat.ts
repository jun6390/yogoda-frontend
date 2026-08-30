import { apiFetch } from "./client";

import type { ChatPlanCard } from "@/types/chat";

export interface ChatSessionMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  messageType?:
    "text" | "fraud_warning" | "terms" | "signup_summary" | "signup_complete";
  plans?: ChatPlanCard[];
  signupData?: Record<string, unknown>;
  preselectedPlan?: { code: string; name: string; monthlyFee: number };
  createdAt: string;
}

export interface LatestSessionResponse {
  session: {
    id: string;
    createdAt: string;
    updatedAt: string;
    endedAt: string | null;
  } | null;
  messages: ChatSessionMessage[];
  collectedInfo: Record<string, string> | null;
  previousInteractionId: string | null;
}

/**
 * 로그인 사용자의 가장 최근 AI 채팅 세션과 전체 대화 내역을 조회합니다.
 */
export async function getLatestChatSession(): Promise<LatestSessionResponse> {
  return apiFetch<LatestSessionResponse>("/api/chats/sessions/latest");
}

export interface ImportGuestChatPayload {
  sessionId: string;
}

export interface ImportGuestChatResponse {
  session: { id: string; createdAt: string; updatedAt: string } | null;
}

/**
 * 로그인 직후, 로그인 전(게스트) 세션에 실시간 저장돼 있던 대화 내역을 회원 세션으로 이관합니다.
 */
export async function importGuestChatSession(
  payload: ImportGuestChatPayload,
): Promise<ImportGuestChatResponse> {
  return apiFetch<ImportGuestChatResponse>("/api/chats/sessions/import", {
    method: "POST",
    body: payload,
  });
}

/**
 * 회원이 "채팅 끝내기"를 눌러 현재 진행 중인 AI 채팅 세션을 종료합니다.
 * 대화 내역은 삭제되지 않으며, 다음 접속 시 새 세션으로 시작됩니다.
 */
export async function endChatSession(sessionId: string): Promise<void> {
  await apiFetch<{ message: string }>("/api/chats/sessions/end", {
    method: "POST",
    body: { sessionId },
  });
}
