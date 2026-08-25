"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { io, Socket } from "socket.io-client";

import { API_BASE_URL } from "@/lib/api/client";
import { endChatSession, getLatestChatSession } from "@/lib/api/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  GUEST_CHAT_LIMIT,
  useChatHistoryStore,
} from "@/stores/chatHistoryStore";
import { usePersonaStore } from "@/stores/personaStore";
import type { ChatMessage, CollectedInfo } from "@/types/chat";

import { useTypewriter } from "./useTypewriter";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  sender: "ai",
  type: "text",
  text: "안녕하세요! 사용자님에게 딱 맞는 베스트 요금제를 추천해 드릴게요. 평소 데이터 사용량이나 선호하시는 혜택(OTT 등)에 대해 편하게 말씀해 주세요!",
};

function subscribeToAuthHydration(onStoreChange: () => void) {
  const unsubscribeHydrate = useAuthStore.persist.onHydrate(onStoreChange);
  const unsubscribeFinishHydration =
    useAuthStore.persist.onFinishHydration(onStoreChange);

  return () => {
    unsubscribeHydrate();
    unsubscribeFinishHydration();
  };
}

/*
 * accessToken은 zustand persist로 localStorage에서 비동기 복원(hydration)되므로,
 * 새로고침 직후 첫 렌더의 isLoggedIn만 보고 판단하면 항상 비회원으로 오판해
 * 회원의 DB 대화 내역 복원이 실행되지 않음. hydration 완료 여부를 별도로 구독함
 */
function useAuthHydrated() {
  return useSyncExternalStore(
    subscribeToAuthHydration,
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}

/**
 * AI 상담 채팅의 상태와 소켓 통신을 담당하는 훅.
 * - 로그인 여부에 따라 회원은 DB, 비회원은 로컬 스토리지에서 이전 대화를 복원함
 * - Gemini Interactions API는 interactionId만 이어서 보내면 서버가 대화 맥락을 기억하므로,
 *   프론트에서 대화 기록을 직접 조립해서 보낼 필요가 없음
 * - collectedInfo(대화로 파악한 정보)를 매 응답마다 갱신해서 반복 질문을 방지하는 이중 안전장치로 사용함
 */
export function useAIChat() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isLoggedIn = !!accessToken;

  // 로컬 스토리지(zustand persist)는 클라이언트에만 존재하므로, 초기 렌더는
  // 서버/클라이언트 모두 동일하게 웰컴 메시지로 시작하고, 실제 복원은 마운트 후
  // useEffect에서 처리해 하이드레이션 불일치를 방지함
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  // 초기값은 항상 0으로 시작(SSR-세이프)하고, 마운트 후 useEffect에서
  // localStorage에 저장된 실제 값으로 동기화함
  const [guestChatCount, setGuestChatCount] = useState(0);
  // 비회원이 무료 상담 횟수를 모두 소진한 직후 로그인 유도 팝업을 띄우기 위한 상태
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  // AI의 질문에 바로 탭해서 보낼 수 있는 빠른 답변 후보. 다음 메시지를 보내면 비워짐
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
  // 회원의 경우 대화가 이어질 채팅 세션 id (최초 메시지 전송 시 서버가 발급, 화면 표시/기록용)
  const sessionIdRef = useRef<string | null>(null);
  // Gemini Interactions API가 서버 쪽에서 관리하는 대화 맥락을 이어가기 위한 토큰
  const interactionIdRef = useRef<string | null>(null);
  // 지금까지 대화로 파악된 정보 (모델이 맥락을 놓치는 경우를 대비한 이중 안전장치)
  const collectedInfoRef = useRef<CollectedInfo | null>(null);
  const isAuthHydrated = useAuthHydrated();

  const appendChars = useCallback((messageId: string, chars: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, text: (msg.text || "") + chars } : msg,
      ),
    );
  }, []);
  const typewriter = useTypewriter(appendChars);

  // 마운트 시 이전 대화 내역 복원 (회원은 DB, 비회원은 로컬 스토리지에서)
  // accessToken의 hydration이 끝나기 전까지는 로그인 여부를 신뢰할 수 없으므로 대기함
  useEffect(() => {
    if (!isAuthHydrated) return;

    async function restoreHistory() {
      if (isLoggedIn) {
        try {
          const {
            session,
            messages: dbMessages,
            collectedInfo,
            previousInteractionId,
          } = await getLatestChatSession();

          // 종료된 세션이면 복원하지 않고 웰컴 메시지로 새로 시작함
          // (sessionIdRef를 비워둬야 다음 메시지 전송 시 서버가 새 세션을 발급함)
          if (!session || session.endedAt || dbMessages.length === 0) return;

          sessionIdRef.current = session.id;
          collectedInfoRef.current = collectedInfo;
          interactionIdRef.current = previousInteractionId;
          setMessages(
            dbMessages.flatMap((m) => {
              const textMsg: ChatMessage = {
                id: m.id,
                sender: m.role === "user" ? "user" : "ai",
                type: "text",
                text: m.content,
              };

              // 요금제 추천 카드가 저장된 메시지는, 실시간 대화 때와 동일하게
              // 텍스트 말풍선 뒤에 카드 메시지를 이어붙여 함께 복원함
              if (m.plans && m.plans.length > 0) {
                const plansMsg: ChatMessage = {
                  id: `${m.id}-plans`,
                  sender: "ai",
                  type: "plans",
                  plans: m.plans,
                };
                return [textMsg, plansMsg];
              }

              return [textMsg];
            }),
          );
        } catch (err) {
          console.error("채팅 내역 조회 실패:", err);
        }
        return;
      }

      const stored = useChatHistoryStore.getState();
      collectedInfoRef.current = stored.collectedInfo;
      interactionIdRef.current = stored.lastInteractionId;
      setGuestChatCount(stored.guestChatCount);
      if (stored.messages.length > 0) {
        setMessages(stored.messages);
      }
    }

    void restoreHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 복원은 hydration 완료 후 한 번만 실행하면 되므로 isLoggedIn 변경(로그인/로그아웃) 시 재실행은 의도적으로 제외함
  }, [isAuthHydrated]);

  // 비회원의 대화 내역을 로컬 스토리지에 동기화 (타자기 효과로 인한 잦은 쓰기를 막기 위해 디바운스)
  useEffect(() => {
    if (isLoggedIn) return;

    const timer = setTimeout(() => {
      useChatHistoryStore.getState().setMessages(messages);
    }, 300);

    return () => clearTimeout(timer);
  }, [messages, isLoggedIn]);

  // 언마운트 시 소켓/타자기 인터벌 리소스 정리
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      typewriter.stopAll();
    };
  }, [typewriter]);

  const startSocketStream = useCallback(
    (text: string, aiMsgId: string) => {
      // socket.io는 REST(fetch)와 달리 빈 문자열로는 연결할 수 없어, client.ts와
      // 같은 API_BASE_URL이 비어 있을 때만 로컬 개발 서버 주소로 대체함
      const apiBase = API_BASE_URL || "http://localhost:8000";

      const socket = io(`${apiBase}/chat`, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        // 비로그인 사용자는 설문 결과가 로컬 스토리지(zustand persist)에만 있으므로
        // 매 요청마다 함께 실어 보내서 AI가 이미 아는 정보를 다시 묻지 않게 함
        const persona = usePersonaStore.getState();
        const { accessToken: token } = useAuthStore.getState();

        socket.emit("message", {
          message: text,
          surveyContext: {
            answers: persona.answers,
            analysisResult: persona.analysisResult,
            isSkipped: persona.isSkipped,
          },
          collectedInfo: collectedInfoRef.current ?? undefined,
          previousInteractionId: interactionIdRef.current ?? undefined,
          token: token ?? undefined,
          sessionId: sessionIdRef.current ?? undefined,
        });
      });

      socket.on("session", (data: { sessionId: string }) => {
        // 회원의 첫 메시지 전송 시 서버가 새로 발급한 세션 id를 기억해둠
        sessionIdRef.current = data.sessionId;
      });

      socket.on("interaction", (data: { interactionId: string }) => {
        // 다음 턴에도 대화가 이어지도록, 이번 응답의 interaction id를 저장해둠
        interactionIdRef.current = data.interactionId;
        if (!isLoggedIn) {
          useChatHistoryStore
            .getState()
            .setLastInteractionId(data.interactionId);
        }
      });

      socket.on("info", (data: CollectedInfo) => {
        // AI가 갱신한 "지금까지 파악된 정보"를 저장해뒀다가 다음 요청에 그대로 다시 실어 보냄
        collectedInfoRef.current = data;
        if (!isLoggedIn) {
          useChatHistoryStore.getState().setCollectedInfo(data);
        }
      });

      socket.on("chunk", (data: string) => {
        setIsTyping(false);
        typewriter.push(aiMsgId, data);
      });

      socket.on("plans", (data: ChatMessage["plans"]) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `${aiMsgId}-plans`,
            sender: "ai",
            type: "plans",
            plans: data,
          },
        ]);
      });

      // AI가 질문했을 때만 오며, 바로 탭해서 보낼 수 있는 답변 후보 목록임
      socket.on("quickReplies", (data: string[]) => {
        setQuickReplies(data);
      });

      socket.on("done", () => {
        socket.disconnect();
      });

      socket.on("error", () => {
        typewriter.stop(aiMsgId);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, type: "error" } : msg,
          ),
        );
        setIsTyping(false);
        setQuickReplies([]);
        socket.disconnect();
      });

      socket.on("connect_error", () => {
        typewriter.stop(aiMsgId);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, type: "error" } : msg,
          ),
        );
        setIsTyping(false);
        setQuickReplies([]);
      });

      socket.on("disconnect", () => {
        setIsTyping(false);
        socketRef.current = null;
      });
    },
    [isLoggedIn, typewriter],
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      // 비회원이 무료 상담 횟수(GUEST_CHAT_LIMIT)를 이미 다 썼다면, 메시지를
      // 보내지 않고(소켓 연결도 시작하지 않고) 로그인 유도 팝업만 다시 띄움
      if (!isLoggedIn && guestChatCount >= GUEST_CHAT_LIMIT) {
        setShowGuestLimitModal(true);
        return;
      }

      const userMsgId = Date.now().toString();
      const aiMsgId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, sender: "user", type: "text", text },
        { id: aiMsgId, sender: "ai", type: "text", text: "" },
      ]);
      setIsTyping(true);
      // 방금 보여준 빠른 답변 후보는 이번 메시지 전송으로 소비됐으므로 지움
      setQuickReplies([]);

      if (!isLoggedIn) {
        // 한도를 채우는 이번 메시지도 AI 응답은 정상적으로 받아야 하므로, 카운트만
        // 올려두고 팝업은 다음 메시지 전송을 시도할 때 함수 상단 가드에서 띄움
        useChatHistoryStore.getState().incrementGuestChatCount();
        setGuestChatCount((prev) => prev + 1);
      }

      startSocketStream(text, aiMsgId);
    },
    [isLoggedIn, guestChatCount, startSocketStream],
  );

  const closeGuestLimitModal = useCallback(() => {
    setShowGuestLimitModal(false);
  }, []);

  /*
   * 회원이 "채팅 끝내기"를 누르면 현재 세션을 서버에 종료 처리하고(대화 내역은 삭제하지 않음),
   * 화면을 웰컴 메시지로 초기화함. sessionId를 비워둬야 다음 메시지 전송 시
   * 서버가 종료된 세션을 재사용하지 않고 새 세션을 발급함
   */
  const endCurrentChat = useCallback(async () => {
    if (!isLoggedIn) return;

    // 아직 서버에 발급된 세션이 없다면(메시지를 한 번도 안 보낸 상태) 종료 API를 부를 필요 없이
    // 화면만 초기화하면 됨
    if (sessionIdRef.current) {
      try {
        await endChatSession(sessionIdRef.current);
      } catch (err) {
        console.error("채팅 종료 실패:", err);
        return;
      }
    }

    sessionIdRef.current = null;
    interactionIdRef.current = null;
    collectedInfoRef.current = null;
    setMessages([WELCOME_MESSAGE]);
    setQuickReplies([]);
  }, [isLoggedIn]);

  // interactionIdRef는 마지막으로 "성공"한 응답 기준으로만 갱신되므로, 실패한 턴을 다시 보내도
  // 자동으로 그 직전까지의 대화에 이어붙게 됨 (별도로 히스토리를 잘라낼 필요 없음)
  const retryMessage = useCallback(
    (failedAiMsgId: string) => {
      const failedIdx = messages.findIndex((m) => m.id === failedAiMsgId);
      if (failedIdx <= 0) return;

      const userMsg = messages[failedIdx - 1];
      if (!userMsg?.text) return;

      typewriter.stop(failedAiMsgId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === failedAiMsgId ? { ...msg, type: "text", text: "" } : msg,
        ),
      );
      setIsTyping(true);
      setQuickReplies([]);

      startSocketStream(userMsg.text, failedAiMsgId);
    },
    [messages, startSocketStream, typewriter],
  );

  return {
    messages,
    isTyping,
    sendMessage,
    retryMessage,
    guestChatCount,
    showGuestLimitModal,
    closeGuestLimitModal,
    isLoggedIn,
    endCurrentChat,
    quickReplies,
  };
}
