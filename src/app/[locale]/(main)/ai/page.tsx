"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Settings,
  Send,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { PlanRecommendationCards } from "@/components/chat/PlanRecommendationCards";
import { AITypingIndicator } from "@/components/ui/AITypingIndicator/AITypingIndicator";
import {
  UserChatBubble,
  AIChatBubble,
} from "@/components/ui/ChatBubble/ChatBubble";
import { ChatMarkdown } from "@/components/ui/ChatMarkdown/ChatMarkdown";
import { Input } from "@/components/ui/Input/Input";
import { useAIChat } from "@/hooks/useAIChat";
import { useRouter } from "@/i18n/navigation";

export default function AIConsultationPage() {
  const router = useRouter();
  const t = useTranslations("AIChat");

  const { messages, isTyping, sendMessage, retryMessage } = useAIChat();
  const [inputText, setInputText] = useState("");

  // 메시지 추가 시 자동 스크롤을 위한 ref
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleBack = () => {
    router.push("/");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
    setInputText("");
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* 상단 헤더 */}
      <header className="flex h-[56px] w-full items-center justify-between border-b border-border-default bg-surface px-lg shrink-0">
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={handleBack}
            className="flex size-10 items-center justify-center text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-sans text-title-16-bold text-text-primary">
            {t("headerTitle")}
          </h1>
        </div>

        <div className="flex items-center gap-md">
          <button className="text-text-secondary hover:text-text-primary">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* 대화 메세지 스크롤 영역 */}
      <div className="min-h-0 flex-1 overflow-y-auto p-lg flex flex-col gap-lg">
        {messages.map((msg) => {
          if (msg.sender === "user") {
            return <UserChatBubble key={msg.id}>{msg.text}</UserChatBubble>;
          }

          // 응답 대기 중인 빈 AI 자리표시 메시지는 렌더링하지 않음
          // (하단의 타이핑 인디케이터가 대신 표시되므로, 그리지 않으면 말풍선이 2개로 보임)
          if (msg.type === "text" && !msg.text) {
            return null;
          }

          return (
            <AIChatBubble
              key={msg.id}
              noBackground={msg.type !== "text"} // 텍스트 말풍선만 흰색 배경 유지
            >
              {/* 일반 텍스트 말풍선 (AI 응답의 마크다운 서식을 그대로 렌더링) */}
              {msg.type === "text" && msg.text && (
                <ChatMarkdown>{msg.text}</ChatMarkdown>
              )}

              {/* 추천 요금제 카드 */}
              {msg.type === "plans" && msg.plans && (
                <PlanRecommendationCards plans={msg.plans} />
              )}

              {/* 링크 이동 말풍선 */}
              {msg.type === "link" && msg.textKey && (
                <button className="flex items-center gap-xs font-sans text-caption-13-bold text-text-brand hover:underline self-start">
                  {t(msg.textKey)} <ChevronRight size={16} />
                </button>
              )}

              {/* 에러 발생 말풍선 */}
              {msg.type === "error" && (
                <div className="flex flex-col gap-sm rounded-lg bg-error-soft border border-error/20 p-lg shadow-sm">
                  <div className="flex items-center gap-sm text-error">
                    <AlertCircle size={18} />
                    <span className="font-sans text-body-14-medium">
                      응답을 불러오지 못했어요.
                    </span>
                  </div>
                  <button
                    onClick={() => retryMessage(msg.id)}
                    className="self-start font-sans text-caption-13-bold text-text-brand underline hover:text-action-primary-hover"
                  >
                    다시 시도
                  </button>
                </div>
              )}
            </AIChatBubble>
          );
        })}

        {/* 타이핑 애니메이션 인디케이터 */}
        {isTyping && (
          <AIChatBubble noBackground>
            <AITypingIndicator state="typing" />
          </AIChatBubble>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 하단 입력 폼 영역 */}
      <div className="border-t border-border-default bg-surface p-lg shrink-0">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center w-full"
        >
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t("inputPlaceholder")}
            className="w-full pr-[56px]"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-sm flex size-[36px] items-center justify-center rounded-full bg-transparent text-text-secondary hover:bg-action-primary hover:text-white active:bg-action-primary-hover active:text-white active:scale-90 disabled:bg-transparent disabled:text-icon-disabled disabled:cursor-not-allowed transition-all"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
