import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ChatMessage } from "@/types/chat";

// 비회원이 보낼 수 있는 최대 메시지 횟수
export const GUEST_CHAT_LIMIT = 3;

// 게스트 채팅 데이터 유효 기간 (24시간)
const GUEST_CHAT_TTL_MS = 24 * 60 * 60 * 1000;

interface ChatHistoryState {
  messages: ChatMessage[];
  // 게스트 대화가 이어질 채팅 세션 id. 서버가 소켓 연결 시 발급하며,
  // 로그인 시 이 값 하나만 서버로 보내면 서버가 이미 실시간 저장해둔 대화를 회원 계정으로 이관함
  sessionId: string | null;
  // 비회원이 지금까지 보낸 메시지 횟수 (localStorage에 저장되므로 새로고침해도 유지됨)
  guestChatCount: number;
  // 게스트 세션이 시작된 시각 (만료 판단용)
  createdAt: number | null;
  setMessages: (messages: ChatMessage[]) => void;
  setSessionId: (sessionId: string) => void;
  incrementGuestChatCount: () => void;
  clearMessages: () => void;
}

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set) => ({
      messages: [],
      sessionId: null,
      guestChatCount: 0,
      createdAt: null,
      setMessages: (messages) => set({ messages }),
      setSessionId: (sessionId) =>
        set((state) => ({
          sessionId,
          // 첫 세션 발급 시각을 기록해 TTL 만료 판단에 활용
          createdAt: state.createdAt ?? Date.now(),
        })),
      incrementGuestChatCount: () =>
        set((state) => ({ guestChatCount: state.guestChatCount + 1 })),
      clearMessages: () =>
        set({
          messages: [],
          sessionId: null,
          guestChatCount: 0,
          createdAt: null,
        }),
    }),
    {
      /*
       * 비회원의 채팅 내역은 회원의 DB 저장과 대응되도록
       * localStorage에 전체 대화를 그대로 보관함.
       * rehydrate 시 24시간이 지난 데이터는 자동으로 삭제함
       */
      name: "yogoda-chat-history",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const { createdAt } = state;
        if (createdAt && Date.now() - createdAt > GUEST_CHAT_TTL_MS) {
          // 만료된 게스트 데이터 즉시 초기화
          state.clearMessages();
        }
      },
    },
  ),
);
