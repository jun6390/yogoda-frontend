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
import type { ChatMessage } from "@/types/chat";

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
 * - 소켓은 페이지 진입 시 미리 연결해두고 메시지 전송 때마다 재연결하지 않아
 *   첫 응답 도달 시간을 단축함
 */
export function useAIChat() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isLoggedIn = !!accessToken;

  // 소켓 이벤트 핸들러 클로저에서 isLoggedIn 최신 값을 참조하기 위한 ref
  const isLoggedInRef = useRef(isLoggedIn);
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  // 이전 대화 내역을 불러오는 동안 스켈레톤 UI를 표시하기 위한 상태
  const [isRestoringHistory, setIsRestoringHistory] = useState(true);
  // 초기값은 항상 0으로 시작(SSR-세이프)하고, 마운트 후 useEffect에서
  // localStorage에 저장된 실제 값으로 동기화함
  const [guestChatCount, setGuestChatCount] = useState(0);
  // 비회원이 무료 상담 횟수를 모두 소진한 직후 로그인 유도 팝업을 띄우기 위한 상태
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  // AI의 질문에 바로 탭해서 답할 수 있는 빠른 답변 후보. 다음 메시지를 보내면 비워짐
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
  // 대화가 이어질 채팅 세션 id. 소켓 연결 시 auth로 실어 보내면 서버가 같은 세션으로 이어감
  const sessionIdRef = useRef<string | null>(null);
  // 현재 수신 중인 AI 응답의 메시지 id. 소켓 이벤트 핸들러에서 어느 말풍선에 쓸지 식별함
  const currentAiMsgIdRef = useRef<string | null>(null);
  const isAuthHydrated = useAuthHydrated();

  const appendChars = useCallback((messageId: string, chars: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, text: (msg.text || "") + chars } : msg,
      ),
    );
  }, []);
  const typewriter = useTypewriter(appendChars);

  /*
   * 소켓을 열고 영구 이벤트 핸들러를 등록함.
   * 메시지 전송마다 새로 연결하지 않고 한 번 맺은 연결을 재사용해
   * 핸드셰이크 대기 시간을 제거함
   */
  const openSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    const apiBase = API_BASE_URL || "http://localhost:8000";
    const { accessToken: token } = useAuthStore.getState();

    const socket = io(`${apiBase}/chat`, {
      transports: ["websocket"],
      auth: {
        token: token ?? undefined,
        sessionId: sessionIdRef.current ?? undefined,
      },
    });
    socketRef.current = socket;

    socket.on(
      "session_created",
      (data: { sessionId: string; promptVersion: string }) => {
        sessionIdRef.current = data.sessionId;
        if (!isLoggedInRef.current) {
          useChatHistoryStore.getState().setSessionId(data.sessionId);
        }
      },
    );

    socket.on("chunk", (data: string) => {
      if (!currentAiMsgIdRef.current) return;
      setIsTyping(false);
      typewriter.push(currentAiMsgIdRef.current, data);
    });

    socket.on("plans", (data: ChatMessage["plans"]) => {
      if (!currentAiMsgIdRef.current) return;
      setMessages((prev) => [
        ...prev,
        {
          id: `${currentAiMsgIdRef.current}-plans`,
          sender: "ai",
          type: "plans",
          plans: data,
        },
      ]);
    });

    socket.on("quickReplies", (data: string[]) => {
      setQuickReplies(data);
    });

    socket.on("done", () => {
      currentAiMsgIdRef.current = null;
      setIsTyping(false);
      // 소켓은 유지해서 다음 메시지도 핸드셰이크 없이 바로 보낼 수 있게 함
    });

    socket.on("error", () => {
      const aiMsgId = currentAiMsgIdRef.current;
      if (aiMsgId) {
        typewriter.stop(aiMsgId);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, type: "error" } : msg,
          ),
        );
        currentAiMsgIdRef.current = null;
      }
      setIsTyping(false);
      setQuickReplies([]);
    });

    socket.on("connect_error", () => {
      const aiMsgId = currentAiMsgIdRef.current;
      if (aiMsgId) {
        typewriter.stop(aiMsgId);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, type: "error" } : msg,
          ),
        );
        currentAiMsgIdRef.current = null;
      }
      setIsTyping(false);
      setQuickReplies([]);
    });

    socket.on("disconnect", () => {
      setIsTyping(false);
      socketRef.current = null;
    });
  }, [typewriter]);

  // 마운트 시 이전 대화 내역 복원 후 소켓 미리 연결
  // accessToken의 hydration이 끝나기 전까지는 로그인 여부를 신뢰할 수 없으므로 대기함
  useEffect(() => {
    if (!isAuthHydrated) return;

    async function init() {
      setIsRestoringHistory(true);

      if (isLoggedIn) {
        try {
          const { session, messages: dbMessages } =
            await getLatestChatSession();

          // 종료된 세션이면 복원하지 않고 웰컴 메시지로 새로 시작함
          if (session && !session.endedAt && dbMessages.length > 0) {
            sessionIdRef.current = session.id;
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
          }
        } catch (err) {
          console.error("채팅 내역 조회 실패:", err);
        }
      } else {
        const stored = useChatHistoryStore.getState();
        sessionIdRef.current = stored.sessionId;
        setGuestChatCount(stored.guestChatCount);
        if (stored.messages.length > 0) {
          setMessages(stored.messages);
        }
      }

      setIsRestoringHistory(false);

      // 대화 내역 복원 후 소켓을 미리 연결해 첫 메시지 응답 속도를 개선함
      openSocket();
    }

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 복원 및 소켓 연결은 hydration 완료 후 한 번만 실행하면 되므로 isLoggedIn, openSocket 변경 시 재실행은 의도적으로 제외함
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

  /*
   * 소켓이 연결돼 있으면 바로 emit하고, 끊겨 있으면 재연결 후 emit함.
   * 페이지 진입 시 미리 연결해두므로 대부분의 경우 대기 없이 바로 전송됨
   */
  const emitMessage = useCallback(
    (text: string) => {
      const persona = usePersonaStore.getState();
      const payload = {
        message: text,
        surveyContext: {
          answers: persona.answers,
          analysisResult: persona.analysisResult,
          isSkipped: persona.isSkipped,
        },
      };

      if (socketRef.current?.connected) {
        socketRef.current.emit("message", payload);
      } else {
        openSocket();
        socketRef.current?.once("connect", () => {
          socketRef.current?.emit("message", payload);
        });
      }
    },
    [openSocket],
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      // 비회원이 무료 상담 횟수(GUEST_CHAT_LIMIT)를 이미 다 썼다면, 메시지를
      // 보내지 않고(소켓 emit도 하지 않고) 로그인 유도 팝업만 다시 띄움
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
      setQuickReplies([]);
      currentAiMsgIdRef.current = aiMsgId;

      if (!isLoggedIn) {
        // 한도를 채우는 이번 메시지도 AI 응답은 정상적으로 받아야 하므로, 카운트만
        // 올려두고 팝업은 다음 메시지 전송을 시도할 때 함수 상단 가드에서 띄움
        useChatHistoryStore.getState().incrementGuestChatCount();
        setGuestChatCount((prev) => prev + 1);
      }

      emitMessage(text);
    },
    [isLoggedIn, guestChatCount, emitMessage],
  );

  const closeGuestLimitModal = useCallback(() => {
    setShowGuestLimitModal(false);
  }, []);

  /*
   * 회원이 "채팅 끝내기"를 누르면 현재 세션을 서버에 종료 처리하고(대화 내역은 삭제하지 않음),
   * 화면을 웰컴 메시지로 초기화함. 소켓을 재연결해 새 세션으로 이어갈 준비를 함
   */
  const endCurrentChat = useCallback(async () => {
    if (!isLoggedIn) return;

    if (sessionIdRef.current) {
      try {
        await endChatSession(sessionIdRef.current);
      } catch (err) {
        console.error("채팅 종료 실패:", err);
        return;
      }
    }

    // sessionId를 비워야 다음 소켓 연결 시 서버가 새 세션을 발급함
    sessionIdRef.current = null;
    socketRef.current?.disconnect();
    socketRef.current = null;
    openSocket();

    setMessages([WELCOME_MESSAGE]);
    setQuickReplies([]);
  }, [isLoggedIn, openSocket]);

  // sessionIdRef는 마지막으로 "성공"한 응답 기준으로만 갱신되므로, 실패한 턴을 다시 보내도
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
      currentAiMsgIdRef.current = failedAiMsgId;

      emitMessage(userMsg.text);
    },
    [messages, emitMessage, typewriter],
  );

  return {
    messages,
    isTyping,
    isRestoringHistory,
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
