import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ChatMessage } from "@/types/chat";

// 비회원이 보낼 수 있는 최대 메시지 횟수
export const GUEST_CHAT_LIMIT = 3;

interface ChatHistoryState {
  messages: ChatMessage[];
  // 게스트 대화가 이어질 채팅 세션 id. 서버가 소켓 연결 시 발급하며,
  // 로그인 시 이 값 하나만 서버로 보내면 서버가 이미 실시간 저장해둔 대화를 회원 계정으로 이관함
  sessionId: string | null;
  // 비회원이 지금까지 보낸 메시지 횟수 (localStorage에 저장되므로 새로고침해도 유지됨)
  guestChatCount: number;
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
      setMessages: (messages) => set({ messages }),
      setSessionId: (sessionId) => set({ sessionId }),
      incrementGuestChatCount: () =>
        set((state) => ({ guestChatCount: state.guestChatCount + 1 })),
      clearMessages: () => set({ messages: [], sessionId: null }),
    }),
    {
      /*
       * 비회원의 채팅 내역은 회원의 DB 저장과 대응되도록
       * localStorage에 전체 대화를 그대로 보관함
       */
      name: "yogoda-chat-history",
    },
  ),
);
