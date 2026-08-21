"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import { getLatestChatSession } from "@/lib/api/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatHistoryStore } from "@/stores/chatHistoryStore";
import { usePersonaStore } from "@/stores/personaStore";
import type { ChatMessage, CollectedInfo } from "@/types/chat";

import { useTypewriter } from "./useTypewriter";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  sender: "ai",
  type: "text",
  text: "안녕하세요! 사용자님에게 딱 맞는 베스트 요금제를 추천해 드릴게요. 평소 데이터 사용량이나 선호하시는 혜택(OTT 등)에 대해 편하게 말씀해 주세요!",
};

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

  const socketRef = useRef<Socket | null>(null);
  // 회원의 경우 대화가 이어질 채팅 세션 id (최초 메시지 전송 시 서버가 발급, 화면 표시/기록용)
  const sessionIdRef = useRef<string | null>(null);
  // Gemini Interactions API가 서버 쪽에서 관리하는 대화 맥락을 이어가기 위한 토큰
  const interactionIdRef = useRef<string | null>(null);
  // 지금까지 대화로 파악된 정보 (모델이 맥락을 놓치는 경우를 대비한 이중 안전장치)
  const collectedInfoRef = useRef<CollectedInfo | null>(null);
  const initialIsLoggedInRef = useRef(isLoggedIn);

  const appendChars = useCallback((messageId: string, chars: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, text: (msg.text || "") + chars } : msg,
      ),
    );
  }, []);
  const typewriter = useTypewriter(appendChars);

  // 마운트 시 이전 대화 내역 복원 (회원은 DB, 비회원은 로컬 스토리지에서)
  // 비동기 함수로 감싸서 실행하는 이유: 로그인 여부와 무관하게 항상 "외부 데이터를
  // 비동기로 가져와 반영"하는 흐름으로 통일해, effect 본문에서 setState를 동기
  // 호출할 때 발생하는 cascading render 경고(react-hooks/set-state-in-effect)를 피함
  useEffect(() => {
    async function restoreHistory() {
      if (initialIsLoggedInRef.current) {
        try {
          const {
            session,
            messages: dbMessages,
            collectedInfo,
            previousInteractionId,
          } = await getLatestChatSession();

          if (!session || dbMessages.length === 0) return;

          sessionIdRef.current = session.id;
          collectedInfoRef.current = collectedInfo;
          interactionIdRef.current = previousInteractionId;
          setMessages(
            dbMessages.map((m) => ({
              id: m.id,
              sender: m.role === "user" ? "user" : "ai",
              type: "text",
              text: m.content,
            })),
          );
        } catch (err) {
          console.error("채팅 내역 조회 실패:", err);
        }
        return;
      }

      const stored = useChatHistoryStore.getState();
      collectedInfoRef.current = stored.collectedInfo;
      interactionIdRef.current = stored.lastInteractionId;
      if (stored.messages.length > 0) {
        setMessages(stored.messages);
      }
    }

    void restoreHistory();
  }, []);

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
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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

      const userMsgId = Date.now().toString();
      const aiMsgId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, sender: "user", type: "text", text },
        { id: aiMsgId, sender: "ai", type: "text", text: "" },
      ]);
      setIsTyping(true);

      startSocketStream(text, aiMsgId);
    },
    [startSocketStream],
  );

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

      startSocketStream(userMsg.text, failedAiMsgId);
    },
    [messages, startSocketStream, typewriter],
  );

  return { messages, isTyping, sendMessage, retryMessage };
}
