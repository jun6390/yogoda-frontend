import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ChatMessage, CollectedInfo } from "@/types/chat";

interface ChatHistoryState {
  messages: ChatMessage[];
  // AI가 대화로 파악한 정보(데이터 사용량/OTT 선호 등)를 함께 저장해서,
  // 새로고침 후에도 이미 답변한 내용을 AI가 다시 묻지 않도록 함
  collectedInfo: CollectedInfo | null;
  // Gemini Interactions API가 서버 쪽에서 관리하는 대화 맥락을 이어가기 위한 토큰
  lastInteractionId: string | null;
  setMessages: (messages: ChatMessage[]) => void;
  setCollectedInfo: (collectedInfo: CollectedInfo) => void;
  setLastInteractionId: (interactionId: string) => void;
  clearMessages: () => void;
}

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set) => ({
      messages: [],
      collectedInfo: null,
      lastInteractionId: null,
      setMessages: (messages) => set({ messages }),
      setCollectedInfo: (collectedInfo) => set({ collectedInfo }),
      setLastInteractionId: (lastInteractionId) => set({ lastInteractionId }),
      clearMessages: () =>
        set({ messages: [], collectedInfo: null, lastInteractionId: null }),
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
