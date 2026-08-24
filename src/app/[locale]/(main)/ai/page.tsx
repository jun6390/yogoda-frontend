"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LogOut, Send, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { PlanRecommendationCards } from "@/components/chat/PlanRecommendationCards";
import { AITypingIndicator } from "@/components/ui/AITypingIndicator/AITypingIndicator";
import {
  UserChatBubble,
  AIChatBubble,
} from "@/components/ui/ChatBubble/ChatBubble";
import { ChatMarkdown } from "@/components/ui/ChatMarkdown/ChatMarkdown";
import { Input } from "@/components/ui/Input/Input";
import { Modal } from "@/components/ui/Modal/Modal";
import { useAIChat } from "@/hooks/useAIChat";
import { useRouter } from "@/i18n/navigation";
import { LOGIN_REDIRECT_STORAGE_KEY } from "@/lib/auth/loginRedirect";

export default function AIConsultationPage() {
  const router = useRouter();
  const t = useTranslations("AIChat");

  const {
    messages,
    isTyping,
    sendMessage,
    retryMessage,
    showGuestLimitModal,
    closeGuestLimitModal,
    isLoggedIn,
    endCurrentChat,
  } = useAIChat();
  const [inputText, setInputText] = useState("");
  // 회원 전용 "채팅 끝내기" 확인 팝업 표시 여부
  const [showEndChatModal, setShowEndChatModal] = useState(false);

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

  const handleGuestLimitLogin = () => {
    closeGuestLimitModal();
    // 로그인 콜백 완료 후 이 화면(AI 채팅)으로 돌아오기 위한 표시
    sessionStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, "/ai");
    router.push("/login");
  };

  const handleEndChatConfirm = () => {
    setShowEndChatModal(false);
    void endCurrentChat();
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

        {isLoggedIn && (
          <div className="flex items-center gap-md">
            <button
              type="button"
              aria-label={t("endChatModal.trigger")}
              onClick={() => setShowEndChatModal(true)}
              className="flex items-center gap-2xs text-text-secondary hover:text-text-primary"
            >
              <LogOut size={18} />
              <span className="font-sans text-caption-13-medium">
                {t("endChatModal.trigger")}
              </span>
            </button>
          </div>
        )}
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

              {/* 에러 발생 시 재시도 배너 */}
              {msg.type === "error" && (
                <AITypingIndicator
                  state="error"
                  onRetry={() => retryMessage(msg.id)}
                />
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

      {/* 비회원 무료 상담 소진 안내 팝업 */}
      {showGuestLimitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-lg"
          onMouseDown={closeGuestLimitModal}
        >
          <Modal
            onMouseDown={(e) => e.stopPropagation()}
            heading={t("guestLimitModal.heading")}
            description={t("guestLimitModal.description")}
            primaryLabel={t("guestLimitModal.primaryLabel")}
            secondaryLabel={t("guestLimitModal.secondaryLabel")}
            onClose={closeGuestLimitModal}
            onPrimaryClick={handleGuestLimitLogin}
            onSecondaryClick={closeGuestLimitModal}
          />
        </div>
      )}

      {/* 회원 전용 채팅 끝내기 확인 팝업 */}
      {showEndChatModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-lg"
          onMouseDown={() => setShowEndChatModal(false)}
        >
          <Modal
            onMouseDown={(e) => e.stopPropagation()}
            heading={t("endChatModal.heading")}
            description={t("endChatModal.description")}
            primaryLabel={t("endChatModal.primaryLabel")}
            secondaryLabel={t("endChatModal.secondaryLabel")}
            onClose={() => setShowEndChatModal(false)}
            onPrimaryClick={handleEndChatConfirm}
            onSecondaryClick={() => setShowEndChatModal(false)}
          />
        </div>
      )}
    </div>
  );
}
