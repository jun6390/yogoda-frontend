"use client";

import { useState } from "react";
import { RotateCcw, Send } from "lucide-react";

import { Badge } from "@/components/ui/Badge/Badge";
import {
  AIChatBubble,
  UserChatBubble,
} from "@/components/ui/ChatBubble/ChatBubble";
import { ChatMarkdown } from "@/components/ui/ChatMarkdown/ChatMarkdown";
import { cn } from "@/lib/utils";

interface TestMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
}

const QUICK_TEST_MESSAGES = [
  "데이터 많이 쓰는 편이에요",
  "넷플릭스 자주 봐요",
  "제일 저렴한 요금제 추천해줘",
  "가입은 어떻게 하나요?",
];

/*
 * 아직 "초안 프롬프트로 테스트"용 백엔드 엔드포인트가 없어서, API 계약이
 * 정해지기 전까지 UI/흐름을 먼저 검증하기 위한 목업 응답. 실제 엔드포인트가
 * 생기면 sendMessage 안의 setTimeout 블록만 API 호출로 교체하면 됨
 */
const MOCK_AI_REPLIES = [
  "말씀해주신 사용 패턴을 보니 **데이터 무제한 요금제**가 잘 맞을 것 같아요. 평소 OTT도 자주 보시나요?",
  "네, 좋아요! 그럼 몇 가지 요금제를 비교해서 보여드릴게요. 예산은 어느 정도로 생각하고 계세요?",
  "가입은 화면 하단의 **가입하기** 버튼을 누르시면 3분 안에 끝나요. 지금 바로 진행해볼까요?",
];

export function PromptTestChat() {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mockReplyIndex, setMockReplyIndex] = useState(0);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: "user", text: trimmed },
    ]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: MOCK_AI_REPLIES[mockReplyIndex % MOCK_AI_REPLIES.length],
        },
      ]);
      setMockReplyIndex((prev) => prev + 1);
      setIsTyping(false);
    }, 700);
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setMockReplyIndex(0);
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-border-default bg-background">
      <div className="flex items-center justify-between gap-sm border-b border-border-default px-lg py-md">
        <div className="flex items-center gap-sm">
          <Badge variant="accent">테스트 모드</Badge>
          <span className="font-sans text-caption-12-regular text-text-tertiary">
            저장 전 프롬프트로 대화 중 (목업 응답)
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

      <div className="flex flex-1 flex-col gap-md overflow-y-auto p-lg">
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
              <ChatMarkdown>{message.text}</ChatMarkdown>
            </AIChatBubble>
          ),
        )}

        {isTyping && (
          <AIChatBubble>
            <span className="font-sans text-body-14-regular text-text-tertiary">
              입력 중...
            </span>
          </AIChatBubble>
        )}
      </div>

      <div className="flex flex-wrap gap-xs border-t border-border-default px-lg pt-md">
        {QUICK_TEST_MESSAGES.map((quickMessage) => (
          <button
            key={quickMessage}
            type="button"
            onClick={() => sendMessage(quickMessage)}
            disabled={isTyping}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border border-border-default px-md py-xs",
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
          sendMessage(input);
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
