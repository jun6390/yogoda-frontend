import { apiFetch } from "./client";

import type { ChatPlanCard } from "@/types/chat";

export interface ChatSessionMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  // AI가 요금제를 추천한 메시지에만 존재함 (재접속 시 카드를 그대로 복원하기 위함)
  plans?: ChatPlanCard[];
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
  // 서버가 게스트 소켓 연결 시 발급한 세션 id. 서버가 이미 실시간으로 저장해둔
  // 해당 세션의 대화 내역을 그대로 로그인한 회원 계정으로 이관함
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
