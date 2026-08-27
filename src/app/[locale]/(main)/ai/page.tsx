"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  LogOut,
  Mic,
  MicOff,
  Send,
  ChevronRight,
  ArrowDown,
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
import { Modal } from "@/components/ui/Modal/Modal";
import { useAIChat } from "@/hooks/useAIChat";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useRouter } from "@/i18n/navigation";
import { LOGIN_REDIRECT_STORAGE_KEY } from "@/lib/auth/loginRedirect";

export default function AIConsultationPage() {
  const router = useRouter();
  const t = useTranslations("AIChat");

  const {
    messages,
    isTyping,
    isRestoringHistory,
    sendMessage,
    retryMessage,
    showGuestLimitModal,
    closeGuestLimitModal,
    isLoggedIn,
    endCurrentChat,
    quickReplies,
  } = useAIChat();
  const [inputText, setInputText] = useState("");
  // 회원 전용 "채팅 끝내기" 확인 팝업 표시 여부
  const [showEndChatModal, setShowEndChatModal] = useState(false);
  // 위로 스크롤 시 맨 아래로 이동 버튼 표시 여부
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // 음성 인식이 확정한 문장을 기존 입력값 뒤에 이어붙임 (여러 번 끊어 말해도 계속 누적됨)
  const handleVoiceResult = useCallback((text: string) => {
    setInputText((prev) => (prev ? `${prev} ${text}` : text));
  }, []);
  const { isListening, isSupported, interimText, toggleListening } =
    useVoiceInput({ onFinalResult: handleVoiceResult });

  // 스크롤 영역 ref (맨 아래 여부 판단에 사용)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 메시지 추가 시 자동 스크롤을 위한 ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isAtBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBottom(false);
  }, []);

  // 채팅 내역 복원 완료 시 즉시 맨 아래로 스크롤
  useEffect(() => {
    if (!isRestoringHistory) {
      chatEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isRestoringHistory]);

  // 맨 아래에 있을 때만 자동 스크롤 (위로 올라간 상태에선 강제 스크롤 안 함)
  useEffect(() => {
    if (isAtBottom()) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isAtBottom]);

  const handleScroll = useCallback(() => {
    setShowScrollBottom(!isAtBottom());
  }, [isAtBottom]);

  const handleBack = () => {
    router.push("/");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
    setInputText("");
  };

  const handleQuickReplyClick = (reply: string) => {
    sendMessage(reply);
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
    <div className="relative flex h-full flex-col bg-background">
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
          <h1 className="select-none font-sans text-title-16-bold text-text-primary">
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
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto p-lg flex flex-col gap-lg"
      >
        {/* 이전 대화 내역을 불러오는 동안 말풍선 형태의 스켈레톤을 보여줌 */}
        {isRestoringHistory ? (
          <ChatHistorySkeleton />
        ) : (
          messages.map((msg) => {
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
          })
        )}
        {/* 타이핑 애니메이션 인디케이터 */}
        {isTyping && (
          <AIChatBubble noBackground>
            <AITypingIndicator state="typing" />
          </AIChatBubble>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 위로 스크롤 시 맨 아래로 이동하는 버튼 */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="맨 아래로"
          className="absolute bottom-[120px] right-lg z-10 flex size-[36px] items-center justify-center rounded-full border-2 border-action-primary bg-surface text-action-primary shadow-md hover:bg-action-primary/5 transition-colors"
        >
          <ArrowDown size={18} />
        </button>
      )}

      {/* AI의 질문에 바로 탭해서 답할 수 있는 빠른 답변 후보 (입력창 바로 위, 흰 배경 없이 고정) */}
      {quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-xs px-lg pt-lg pb-md shrink-0">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => handleQuickReplyClick(reply)}
              className="rounded-full border border-border-default bg-surface px-md py-xs font-sans text-caption-13-medium text-text-secondary transition-colors hover:border-action-primary hover:text-action-primary"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* 하단 입력 폼 영역 */}
      <div className="border-t border-border-default bg-surface p-lg shrink-0">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center w-full"
        >
          <Input
            value={isListening && interimText ? interimText : inputText}
            onChange={(e) => setInputText(e.target.value)}
            // 인식 중에는 확정되지 않은 말이 실시간으로 보이므로, 직접 타이핑해서 덮어쓰지 못하게 막음
            readOnly={isListening}
            placeholder={t("inputPlaceholder")}
            className={isSupported ? "w-full pr-[96px]" : "w-full pr-[56px]"}
          />

          {/* 브라우저가 음성 인식을 지원할 때만 마이크 버튼 노출 (사파리 등 미지원 브라우저 대비) */}
          {isSupported && (
            <div className="absolute right-[48px] flex items-center justify-center">
              {/* 녹음 중일 때 바깥으로 퍼지는 링 효과 */}
              {isListening && (
                <span className="absolute size-[36px] rounded-full bg-action-primary/20 animate-ping" />
              )}
              <button
                type="button"
                onClick={toggleListening}
                aria-label={t(
                  isListening ? "voiceInput.stop" : "voiceInput.start",
                )}
                className={
                  isListening
                    ? "relative flex size-[36px] items-center justify-center text-action-primary transition-colors"
                    : "relative flex size-[36px] items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
                }
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={
              inputText.trim()
                ? "absolute right-sm flex size-[36px] items-center justify-center text-action-primary transition-colors active:scale-90"
                : "absolute right-sm flex size-[36px] items-center justify-center text-text-tertiary cursor-not-allowed transition-colors"
            }
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

function ChatHistorySkeleton() {
  return (
    <>
      {/* AI 말풍선 스켈레톤 */}
      <div className="flex w-full items-start gap-sm">
        <div className="mt-[2px] size-[32px] shrink-0 animate-pulse rounded-full bg-surface-subtle" />
        <div className="flex w-[85%] flex-col gap-xs rounded-[12px] rounded-tl-[4px] border border-border-default bg-surface px-lg py-md shadow-sm">
          <div className="h-[14px] w-full animate-pulse rounded-full bg-surface-subtle" />
          <div className="h-[14px] w-4/5 animate-pulse rounded-full bg-surface-subtle" />
          <div className="h-[14px] w-3/5 animate-pulse rounded-full bg-surface-subtle" />
        </div>
      </div>

      {/* 유저 말풍선 스켈레톤 */}
      <div className="flex w-full justify-end">
        <div className="h-[42px] w-[80%] animate-pulse rounded-[12px] rounded-tr-[4px] bg-action-primary/20" />
      </div>

      {/* AI 말풍선 스켈레톤 */}
      <div className="flex w-full items-start gap-sm">
        <div className="mt-[2px] size-[32px] shrink-0 animate-pulse rounded-full bg-surface-subtle" />
        <div className="flex w-[85%] flex-col gap-xs rounded-[12px] rounded-tl-[4px] border border-border-default bg-surface px-lg py-md shadow-sm">
          <div className="h-[14px] w-full animate-pulse rounded-full bg-surface-subtle" />
          <div className="h-[14px] w-4/5 animate-pulse rounded-full bg-surface-subtle" />
        </div>
      </div>
    </>
  );
}
