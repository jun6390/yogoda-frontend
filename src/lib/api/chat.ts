import { apiFetch } from "./client";

import type { ChatPlanCard, CollectedInfo } from "@/types/chat";

export interface ChatSessionMessage {
  id: string;
  role: "user" | "admin";
  content: string;
  // AI가 요금제를 추천한 메시지에만 존재함 (재접속 시 카드를 그대로 복원하기 위함)
  plans?: ChatPlanCard[];
  createdAt: string;
}

export interface LatestSessionResponse {
  session: { id: string; createdAt: string; updatedAt: string } | null;
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
  messages: {
    role: "user" | "admin";
    content: string;
    plans?: ChatPlanCard[];
  }[];
  collectedInfo?: CollectedInfo;
  lastInteractionId?: string;
}

export interface ImportGuestChatResponse {
  session: { id: string; createdAt: string; updatedAt: string } | null;
}

/**
 * 비회원(게스트) 상태에서 로컬 스토리지에 쌓인 대화 내역을 로그인 직후 회원 세션으로 이관합니다.
 */
export async function importGuestChatSession(
  payload: ImportGuestChatPayload,
): Promise<ImportGuestChatResponse> {
  return apiFetch<ImportGuestChatResponse>("/api/chats/sessions/import", {
    method: "POST",
    body: payload,
  });
}
