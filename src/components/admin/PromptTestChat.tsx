"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Send } from "lucide-react";

import { AdminTypingIndicator } from "@/components/admin/AdminTypingIndicator";
import { Badge } from "@/components/ui/Badge/Badge";
import {
  AIChatBubble,
  UserChatBubble,
} from "@/components/ui/ChatBubble/ChatBubble";
import { ChatMarkdown } from "@/components/ui/ChatMarkdown/ChatMarkdown";
import { usePromptTestConversation } from "@/hooks/usePromptTestConversation";
import { cn } from "@/lib/utils";

const QUICK_TEST_MESSAGES = [
  "데이터 많이 쓰는 편이에요",
  "넷플릭스 자주 봐요",
  "제일 저렴한 요금제 추천해줘",
  "가입은 어떻게 하나요?",
];

interface PromptTestChatProps {
  promptContent: string;
}

export function PromptTestChat({ promptContent }: PromptTestChatProps) {
  const [input, setInput] = useState("");
  const { messages, isTyping, isFinalizing, error, sendMessage, reset } =
    usePromptTestConversation(promptContent);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    sendMessage(text);
    setInput("");
  };

  const handleReset = () => {
    reset();
    setInput("");
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-border-default bg-background">
      <div className="flex items-center justify-between gap-sm border-b border-border-default px-lg py-md">
        <div className="flex items-center gap-sm">
          <Badge variant="default">테스트 모드</Badge>
          <span className="font-sans text-caption-12-regular text-text-tertiary">
            저장 전 프롬프트로 대화 중
          </span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex shrink-0 items-center gap-xs font-sans text-caption-12-bold text-text-secondary hover:text-text-primary"
        >
          <RotateCcw aria-hidden="true" size={14} />
          초기화
        </button>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex flex-1 flex-col gap-md overflow-y-auto p-lg"
      >
        {messages.length === 0 && !isTyping && (
          <p className="font-sans text-body-14-regular text-text-tertiary">
            아래 빠른 테스트 버튼을 누르거나 메시지를 입력해서 지금 작성 중인
            프롬프트를 테스트해보세요.
          </p>
        )}

        {messages.map((message) =>
          message.sender === "user" ? (
            <UserChatBubble key={message.id}>{message.text}</UserChatBubble>
          ) : (
            <AIChatBubble key={message.id}>
              {message.text ? (
                <ChatMarkdown>{message.text}</ChatMarkdown>
              ) : (
                <span className="font-sans text-body-14-regular text-text-tertiary">
                  입력 중...
                </span>
              )}
            </AIChatBubble>
          ),
        )}

        {isTyping && isFinalizing && (
          <AIChatBubble noBackground>
            <AdminTypingIndicator message="정리하는 중..." />
          </AIChatBubble>
        )}
      </div>

      {error && (
        <p className="border-t border-border-default px-lg pt-md font-sans text-caption-12-regular text-error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-xs border-t border-border-default px-lg pt-md">
        {QUICK_TEST_MESSAGES.map((quickMessage) => (
          <button
            key={quickMessage}
            type="button"
            onClick={() => handleSend(quickMessage)}
            disabled={isTyping}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border border-border-default bg-surface px-md py-xs",
              "font-sans text-caption-12-bold text-text-secondary transition-colors hover:bg-surface-subtle",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {quickMessage}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-sm p-lg pt-md"
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="테스트 메시지를 입력하세요"
          disabled={isTyping}
          className="h-10 flex-1 rounded-md border border-border-default bg-surface px-md font-sans text-body-14-regular text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        />
        <button
          type="submit"
          disabled={isTyping || !input.trim()}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md bg-action-primary text-text-on-primary transition-colors",
            "hover:bg-action-primary-hover",
            "disabled:cursor-not-allowed disabled:bg-border-default disabled:text-text-tertiary",
          )}
        >
          <Send aria-hidden="true" size={16} />
        </button>
      </form>
    </div>
  );
}
