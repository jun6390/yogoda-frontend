"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Settings,
  Send,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { AITypingIndicator } from "@/components/ui/AITypingIndicator/AITypingIndicator";
import {
  UserChatBubble,
  AIChatBubble,
} from "@/components/ui/ChatBubble/ChatBubble";
import { Input } from "@/components/ui/Input/Input";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// 대화 메시지 타입 정의
interface Message {
  id: string;
  sender: "ai" | "user";
  type: "text" | "plans" | "link" | "error";
  text?: string;
  textKey?: string;
  plans?: Array<{
    badge: string;
    name: string;
    price: string;
    specs: string;
    savings: string;
    matchRate: string;
  }>;
}

export default function AIConsultationPage() {
  const router = useRouter();
  const t = useTranslations("AIChat");

  // 입력창 및 타이핑 인디케이터 상태
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // 대화 기록 초기값
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "user",
      type: "text",
      text: "데이터를 많이 쓰고 OTT도 자주 봐요.",
    },
    {
      id: "2",
      sender: "ai",
      type: "text",
      text: "사용 패턴을 보면 데이터 사용량이 높고 OTT 혜택도 중요하게 보고 계시네요. 사용자님에게 가장 잘 맞는 베스트 요금제 3개를 골라봤어요.",
    },
    {
      id: "3",
      sender: "ai",
      type: "plans",
      plans: [
        {
          badge: "BEST 1",
          name: "5G 데이터 플러스",
          price: "59,000원 / 월",
          specs: "80GB · 통화-문자 무제한 · OTT 선택 제공",
          savings: "현재 요금제 대비 월 10,000원 절약",
          matchRate: "96% 일치",
        },
        {
          badge: "BEST 2",
          name: "5G 슬림 플러스",
          price: "47,000원 / 월",
          specs: "30GB · 통화-문자 무제한 · OTT 선택 제공",
          savings: "현재 요금제 대비 월 22,000원 절약",
          matchRate: "88% 일치",
        },
        {
          badge: "BEST 3",
          name: "5G 심플 라이트",
          price: "39,000원 / 월",
          specs: "12GB · 통화-문자 무제한 · OTT 선택 제공",
          savings: "현재 요금제 대비 월 30,000원 절약",
          matchRate: "82% 일치",
        },
      ],
    },
    {
      id: "4",
      sender: "ai",
      type: "link",
      textKey: "explorePlans",
    },
  ]);

  // 스크롤 제어를 위한 ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 추천 카드들의 가로 스크롤 상태 추적 (현재 인덱스)
  const [activeCardIdx, setActiveCardIdx] = useState(0);

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 뒤로가기 핸들러
  const handleBack = () => {
    router.push("/");
  };

  // 메시지 전송 핸들러
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // 사용자 입력 메시지 추가
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      type: "text",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: Message = {
        id: Date.now().toString(),
        sender: "ai",
        type: "text",
        text: "사용자 님의 최근 3개월 실사용 패턴을 고려해 보면, 무제한 요금제를 쓰기보다는 사용량에 딱 맞춘 요금제를 설계하는 것이 지출을 대폭 줄일 수 있는 지름길이에요.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1500);
  };

  // 가로 스크롤 시 도트 인디케이터 업데이트
  const handleCardScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width > 0) {
      const newIdx = Math.round(scrollLeft / width);
      setActiveCardIdx(newIdx);
    }
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
          const isUser = msg.sender === "user";

          // 1. 사용자 말풍선 처리
          if (isUser) {
            return <UserChatBubble key={msg.id}>{msg.text}</UserChatBubble>;
          }

          // AI 말풍선 처리 (타입별 분기)
          return (
            <AIChatBubble
              key={msg.id}
              noBackground={msg.type !== "text"} // 텍스트 말풍선만 흰색 배경 유지
            >
              {/* 일반 텍스트 말풍선 */}
              {msg.type === "text" && msg.text}

              {/* 추천 요금제 3개 가로 슬라이더 카드 말풍선 */}
              {msg.type === "plans" && msg.plans && (
                <div className="flex flex-col gap-sm w-[290px] overflow-hidden">
                  {/* 가로 스크롤 카드 리스트 (양옆 카드 피크 효과 적용) */}
                  <div
                    onScroll={handleCardScroll}
                    className="flex gap-md overflow-x-auto snap-x snap-mandatory scrollbar-none pb-xs w-full"
                  >
                    {msg.plans.map((plan, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-sm rounded-lg bg-surface border border-border-default p-lg shadow-sm w-[250px] shrink-0 snap-start"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "rounded-full px-md py-sm font-sans text-micro-11-bold",
                              idx === 0
                                ? "bg-action-primary text-text-on-primary"
                                : "bg-surface-subtle text-text-secondary border border-border-default",
                            )}
                          >
                            {plan.badge}
                          </span>
                          <span className="font-sans text-caption-12-bold text-text-brand">
                            {plan.matchRate}
                          </span>
                        </div>

                        <div className="space-y-xs">
                          <strong className="block font-sans text-title-18-bold text-text-primary">
                            {plan.name}
                          </strong>
                          <span className="block font-sans text-caption-13-bold text-text-primary">
                            {plan.price}
                          </span>
                          <p className="font-sans text-micro-11-regular text-text-secondary">
                            {plan.specs}
                          </p>
                        </div>

                        <div className="border-t border-border-default pt-md space-y-md">
                          <span className="block font-sans text-caption-12-bold text-success">
                            {plan.savings}
                          </span>

                          <button className="flex items-center gap-xs font-sans text-caption-12-medium text-text-secondary hover:text-text-primary">
                            내 요금제와 비교 <ChevronRight size={14} />
                          </button>

                          <button className="w-full h-[40px] rounded-lg bg-action-primary text-text-on-primary font-sans text-caption-13-bold hover:bg-action-primary-hover transition-colors">
                            {t("selectBtn")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 캐러셀 인디케이터 도트 */}
                  <div className="flex justify-center gap-xs pt-xs">
                    {msg.plans.map((_, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "size-xs rounded-full transition-all duration-300",
                          activeCardIdx === idx
                            ? "bg-action-primary w-md"
                            : "bg-border-strong",
                        )}
                      />
                    ))}
                  </div>
                </div>
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
                  <button className="self-start font-sans text-caption-13-bold text-text-brand underline hover:text-action-primary-hover">
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
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
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
