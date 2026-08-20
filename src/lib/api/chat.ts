import { apiFetch } from "./client";

export interface GuestQuotaResponse {
  remainingQuota: number;
  maxQuota: number;
  isExceeded: boolean;
}

/**
 * 비회원 무료 상담 잔여 횟수를 조회합니다.
 */
export async function getGuestQuota(
  guestId?: string,
): Promise<GuestQuotaResponse> {
  const query = guestId ? `?guestId=${encodeURIComponent(guestId)}` : "";
  return apiFetch<GuestQuotaResponse>(`/api/chats/guest-quota${query}`);
}

export interface ChatSessionMessage {
  id: string;
  role: "user" | "admin";
  content: string;
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
