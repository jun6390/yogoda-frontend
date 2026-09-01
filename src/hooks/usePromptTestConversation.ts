"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { streamPromptTest } from "@/lib/api/admin/promptTest";
import { ApiError } from "@/lib/api/client";

export interface TestMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
}

export function usePromptTestConversation(promptContent: string) {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousInteractionIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) {
        return;
      }

      const userMessageId = `user-${Date.now()}`;
      const aiMessageId = `ai-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: userMessageId, sender: "user", text: trimmed },
        { id: aiMessageId, sender: "ai", text: "" },
      ]);
      setIsTyping(true);
      setIsFinalizing(false);
      setError(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      streamPromptTest({
        promptContent,
        message: trimmed,
        previousInteractionId: previousInteractionIdRef.current,
        signal: abortController.signal,
        onChunk: (chunkText) => {
          setMessages((prev) =>
            prev.map((testMessage) =>
              testMessage.id === aiMessageId
                ? { ...testMessage, text: testMessage.text + chunkText }
                : testMessage,
            ),
          );
        },
        // 텍스트 스트리밍은 끝났지만 done(인터랙션 ID+추천 결과)은 아직 안 온
        // "정리 중" 구간에 진입했다는 서버 신호. 데이터는 없고 신호 용도로만 씀
        onLoadingExtra: () => {
          setIsFinalizing(true);
        },
      })
        .then(({ interactionId }) => {
          previousInteractionIdRef.current = interactionId;
        })
        .catch((err: unknown) => {
          if (abortController.signal.aborted) {
            return;
          }

          setMessages((prev) =>
            prev.filter(
              (testMessage) =>
                testMessage.id !== aiMessageId || testMessage.text !== "",
            ),
          );
          setError(
            err instanceof ApiError
              ? err.message
              : "AI 응답을 받는 중 오류가 발생했어요.",
          );
        })
        .finally(() => {
          if (abortControllerRef.current === abortController) {
            setIsTyping(false);
            setIsFinalizing(false);
          }
        });
    },
    [promptContent, isTyping],
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    previousInteractionIdRef.current = null;
    setMessages([]);
    setIsTyping(false);
    setIsFinalizing(false);
    setError(null);
  }, []);

  return { messages, isTyping, isFinalizing, error, sendMessage, reset };
}
