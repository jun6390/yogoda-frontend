"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  LogOut,
  Mic,
  Send,
  Square,
  ChevronRight,
  ArrowDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { PlanRecommendationCards } from "@/components/chat/PlanRecommendationCards";
import { FraudWarningCard } from "@/components/chat/FraudWarningCard";
import { TermsAgreementCard } from "@/components/chat/TermsAgreementCard";
import { SignupSummaryCard } from "@/components/chat/SignupSummaryCard";
import { SignupCompleteCard } from "@/components/chat/SignupCompleteCard";
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
import type { PreselectedPlan } from "@/types/chat";

export default function AIConsultationPage() {
  const router = useRouter();
  const t = useTranslations("AIChat");
  // 요금제 상세 페이지에서 "AI와 가입하기"를 눌렀을 때 sessionStorage에 저장된 정보를 읽음
  // URL 노출 없이 안전하게 전달하고, 읽은 즉시 삭제함
  const [preselectedPlan, setPreselectedPlan] = useState<
    PreselectedPlan | undefined
  >(undefined);

  // 채팅에서 요금제 상세로 넘어갔다가 다시 /ai로 돌아오는 경우, Next.js가 이 페이지를
  // 새로 마운트하지 않고 재사용할 수 있어 mount-only effect(빈 deps)가 다시 실행되지
  // 않을 수 있음. entry 쿼리 파라미터는 리마운트 여부와 무관하게 매번 갱신되는
  // useSearchParams로 감지되므로, 이를 트리거로 매번 sessionStorage를 다시 읽음
  const entryToken = useSearchParams().get("entry");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("preselectedPlan");
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreselectedPlan(JSON.parse(stored) as PreselectedPlan);
      }
    } catch {
      // sessionStorage 접근 불가 환경에서는 무시
    }
    if (entryToken) {
      // 재사용을 유도한 쿼리 파라미터는 URL에 남기지 않고 바로 정리함
      router.replace("/ai");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryToken]);

  const {
    messages,
    isTyping,
    thinkingMessage,
    isRestoringHistory,
    sendMessage,
    stopGeneration,
    retryMessage,
    showGuestLimitModal,
    closeGuestLimitModal,
    isLoggedIn,
    endCurrentChat,
    quickReplies,
    isSignupFlow,
    isSignupComplete,
    currentSignupStep,
    sendMessageSilent,
  } = useAIChat({ preselectedPlan });

  const [inputText, setInputText] = useState("");
  // 회원 전용 "채팅 끝내기" 확인 팝업 표시 여부
  const [showEndChatModal, setShowEndChatModal] = useState(false);
  // 채팅 끝내기 → 새 채팅 전환 시 메시지 영역 페이드 아웃/인 제어
  const [isFadingOut, setIsFadingOut] = useState(false);
  // 위로 스크롤 시 맨 아래로 이동 버튼 표시 여부
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // 음성 인식이 확정한 문장을 기존 입력값 뒤에 이어붙임 (여러 번 끊어 말해도 계속 누적됨)
  const handleVoiceResult = useCallback((text: string) => {
    setInputText((prev) => (prev ? `${prev} ${text}` : text));
  }, []);
  const { isListening, isSupported, interimText, toggleListening } =
    useVoiceInput({ onFinalResult: handleVoiceResult });

  // 입력창 ref. 정지 버튼을 누르면 되돌린 텍스트를 바로 이어서 편집할 수 있도록 포커스를 줌
  const inputRef = useRef<HTMLInputElement>(null);
  // 스크롤 영역 ref (맨 아래 여부 판단에 사용)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 메시지 추가 시 자동 스크롤을 위한 ref
  const chatEndRef = useRef<HTMLDivElement>(null);
  // 새 메시지 렌더링 직전에 바닥에 있었는지 기억 (DOM 갱신 후 isAtBottom()을 쓰면 늦음)
  const wasAtBottomRef = useRef(true);

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

  // 새 메시지·타이핑 표시 변경 시 항상 맨 아래로 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleScroll = useCallback(() => {
    const atBottom = isAtBottom();
    wasAtBottomRef.current = atBottom;
    setShowScrollBottom(!atBottom);
  }, [isAtBottom]);

  const handleBack = () => {
    router.push("/");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 정지 직후 잠깐 동안, 그리고 AI 응답을 기다리는 동안(Enter로 폼이 그대로
    // 제출되는 경우 포함)에는 전송하지 않음
    if (justStoppedRef.current || isTyping) return;
    sendMessage(inputText);
    setInputText("");
    // 전송 즉시 맨 아래로 이동 (useEffect 보다 한 틱 빠르게)
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const handleQuickReplyClick = (reply: string) => {
    sendMessage(reply);
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  // 정지 직후 짧은 시간 동안 정지 버튼 연타와 (같은 자리에 나타난) 전송 버튼으로의
  // 겹침 클릭을 막기 위한 플래그. handleSubmit에서도 함께 확인함
  const justStoppedRef = useRef(false);

  // AI 응답 생성 중 정지 버튼을 누르면, 서버에 stop을 알리고 방금 보낸 사용자
  // 메시지를 다시 입력창으로 되돌림. (사용자 말풍선 없이 시작된 요청이면 복원할
  // 텍스트가 없으므로 입력창은 그대로 둠)
  const handleStop = () => {
    if (justStoppedRef.current) return;

    justStoppedRef.current = true;
    window.setTimeout(() => {
      justStoppedRef.current = false;
    }, 400);

    const restoredText = stopGeneration();
    if (restoredText) {
      setInputText(restoredText);
    }
    // setInputText 반영 및 리렌더 이후에 포커스를 줘야 커서가 텍스트 끝에 정확히 위치함
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
  };

  const handleGuestLimitLogin = () => {
    closeGuestLimitModal();
    // 로그인 콜백 완료 후 이 화면(AI 채팅)으로 돌아오기 위한 표시
    sessionStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, "/ai");
    router.push("/login");
  };

  const handleEndChatConfirm = () => {
    setShowEndChatModal(false);
    setIsFadingOut(true);
    setTimeout(() => {
      setPreselectedPlan(undefined);
      void endCurrentChat().finally(() => {
        setIsFadingOut(false);
      });
    }, 280);
  };

  // 가입 완료 후에는 입력창 비활성화
  const isInputDisabled =
    isSignupComplete || currentSignupStep === "terms_agreement";

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
            {isSignupFlow ? "요금제 가입" : t("headerTitle")}
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
            </button>
          </div>
        )}
      </header>

      {/* 대화 메세지 스크롤 영역 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={[
          "min-h-0 flex-1 overflow-y-auto p-lg pb-[32px] flex flex-col gap-lg",
          "transition-all duration-300 ease-in-out",
          isFadingOut ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        ].join(" ")}
      >
        {/* 이전 대화 내역을 불러오는 동안 말풍선 형태의 스켈레톤을 보여줌 */}
        {isRestoringHistory ? (
          <ChatHistorySkeleton />
        ) : (
          <>
            {/* 채팅 상단 개인정보 수집 안내 문구 */}
            <p className="text-center text-caption-12-regular text-text-tertiary px-md">
              원활한 상담을 위해 대화 내용이 저장될 수 있습니다.
            </p>
            {messages.map((msg) => {
              if (msg.sender === "user") {
                return <UserChatBubble key={msg.id}>{msg.text}</UserChatBubble>;
              }

              // 응답 대기 중인 빈 AI 자리표시 메시지는 렌더링하지 않음
              // (하단의 타이핑 인디케이터가 대신 표시되므로, 그리지 않으면 말풍선이 2개로 보임)
              if (msg.type === "text" && !msg.text) {
                return null;
              }

              // 가입 완료 카드는 풀너비 페이지형으로 AIChatBubble 밖에서 독립 렌더링
              if (msg.type === "signup_complete") {
                return <SignupCompleteCard key={msg.id} />;
              }

              return (
                <AIChatBubble key={msg.id} noBackground={msg.type !== "text"}>
                  {/* 일반 텍스트 말풍선 (AI 응답의 마크다운 서식을 그대로 렌더링) */}
                  {msg.type === "text" && msg.text && (
                    <ChatMarkdown>{msg.text}</ChatMarkdown>
                  )}

                  {/* 추천 요금제 카드 */}
                  {msg.type === "plans" && msg.plans && (
                    <PlanRecommendationCards plans={msg.plans} />
                  )}

                  {/* 명의도용 방지 안내 카드 */}
                  {msg.type === "fraud_warning" && <FraudWarningCard />}

                  {/* 약관 동의 카드 */}
                  {msg.type === "terms" && (
                    <TermsAgreementCard onAgree={sendMessageSilent} />
                  )}

                  {/* 가입 정보 최종 확인 카드 */}
                  {msg.type === "signup_summary" && (
                    <SignupSummaryCard
                      signupData={msg.signupData ?? {}}
                      plan={msg.preselectedPlan ?? preselectedPlan}
                    />
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
          </>
        )}
        {/* 타이핑 애니메이션 인디케이터 */}
        {isTyping && (
          <AIChatBubble noBackground>
            <AITypingIndicator state="typing" message={thinkingMessage} />
          </AIChatBubble>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* AI의 질문에 바로 탭해서 답할 수 있는 빠른 답변 후보 */}
      {quickReplies.length > 0 && !isInputDisabled && (
        <div className="absolute bottom-[88px] left-0 right-0 flex flex-nowrap gap-xs px-lg pb-xs z-10 overflow-x-auto scrollbar-hide">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => handleQuickReplyClick(reply)}
              className="shrink-0 whitespace-nowrap rounded-full border border-border-default bg-surface px-md py-xs font-sans text-caption-13-medium text-text-secondary transition-colors hover:border-action-primary hover:text-action-primary active:border-action-primary active:text-action-primary"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

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

      {/* 하단 입력 폼 영역 */}
      <div className="border-t border-border-default bg-surface p-lg shrink-0">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center w-full"
        >
          <Input
            ref={inputRef}
            value={isListening && interimText ? interimText : inputText}
            onChange={(e) => setInputText(e.target.value)}
            readOnly={isListening}
            placeholder={t("inputPlaceholder")}
            className={
              isListening
                ? "w-full pl-[44px] pr-[40px] border-[1.5px] border-action-primary"
                : "w-full pl-[44px] pr-[40px]"
            }
          />

          {/* 마이크 버튼 — 인풋 왼쪽, 미지원 브라우저에서는 invisible로 자리 유지 */}
          <div
            className={
              isSupported
                ? "absolute left-sm flex items-center justify-center"
                : "absolute left-sm flex items-center justify-center invisible"
            }
            aria-hidden={!isSupported}
          >
            <button
              type="button"
              onClick={toggleListening}
              tabIndex={isSupported ? undefined : -1}
              aria-label={t(
                isListening ? "voiceInput.stop" : "voiceInput.start",
              )}
              className={
                isListening
                  ? "relative flex size-[36px] items-center justify-center text-action-primary transition-colors"
                  : "relative flex size-[36px] items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
              }
            >
              <Mic
                size={16}
                className={
                  isListening
                    ? "motion-safe:animate-[micPulse_1s_ease-in-out_infinite]"
                    : undefined
                }
              />
            </button>
          </div>

          {/* AI 응답을 기다리는 중에는 전송 버튼이 정지 버튼으로 바뀜 */}
          {isTyping ? (
            <button
              type="button"
              onClick={handleStop}
              aria-label={t("stopGeneration")}
              className="absolute right-sm flex size-[36px] items-center justify-center text-action-primary transition-colors active:scale-90"
            >
              <span className="flex size-6.5 items-center justify-center rounded-full bg-action-primary/15">
                <Square size={12} fill="currentColor" />
              </span>
            </button>
          ) : (
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
          )}
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
