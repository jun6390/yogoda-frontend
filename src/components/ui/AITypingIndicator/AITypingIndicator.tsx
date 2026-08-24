import { useEffect, useState } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type AITypingIndicatorState = "typing" | "error";

interface AITypingIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  // 타이핑 중(typing) 또는 에러 발생(error) 상태를 수신
  state?: AITypingIndicatorState;
  // error 상태에서 "다시 시도" 버튼을 눌렀을 때 실행할 콜백
  onRetry?: () => void;
}

// 대기 체감을 줄이기 위해 이 간격마다 다음 문구로 순환함
const TYPING_MESSAGE_INTERVAL_MS = 4000;

export function AITypingIndicator({
  state = "typing",
  onRetry,
  className,
  ...props
}: AITypingIndicatorProps) {
  const t = useTranslations("AITypingIndicator");
  const common = useTranslations("Common");
  // AI가 실제로 몇 단계까지 진행했는지는 알 수 없어, 실제 진행 상황이 아니라
  // 대기 중임을 지루하지 않게 보여주기 위한 문구를 순서대로 순환시킴
  const typingMessages = t.raw("typingMessages") as string[];
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // 이 컴포넌트는 isTyping이 true일 때만 마운트되므로, 매 응답 대기마다
    // messageIndex는 초기값(0)에서 새로 시작함 — 별도 리셋 로직이 필요 없음
    if (state !== "typing" || typingMessages.length <= 1) return;

    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % typingMessages.length);
    }, TYPING_MESSAGE_INTERVAL_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- typingMessages는 번역 리소스로 렌더마다 재생성되므로 의존성에서 제외함
  }, [state]);

  return (
    <div
      className={cn("flex items-end gap-sm", className)}
      aria-live="polite"
      {...props}
    >
      {state === "typing" ? (
        <div className="flex items-center rounded-[12px] rounded-tl-[4px] bg-surface border border-border-default shadow-sm px-lg py-md">
          <span
            // messageIndex를 key로 줘서 문구가 바뀔 때마다 아래 글자 span들을 새로 마운트시킴
            // (그래야 매번 wave 애니메이션이 처음부터 다시 재생됨)
            key={messageIndex}
            className="font-sans text-caption-13-medium text-text-secondary"
          >
            {/* 로딩 중임이 계속 느껴지도록 글자마다 delay를 줘서 지렁이처럼 순차적으로 물결치게 함 */}
            {(typingMessages[messageIndex] ?? t("typingAlt"))
              .split("")
              .map((char, index) => (
                <span
                  key={index}
                  className="inline-block motion-safe:animate-[typingMessageWave_1.2s_ease-in-out_infinite]"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {char === " " ? " " : char}
                </span>
              ))}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-sm rounded-bl-lg rounded-br-lg rounded-tl-xs rounded-tr-lg bg-surface-subtle px-lg py-md">
          <p className="font-sans text-body-14-regular text-text-secondary">
            {t("error")}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="self-start font-sans text-caption-13-medium text-text-brand underline"
          >
            {common("retry")}
          </button>
        </div>
      )}
    </div>
  );
}

export type AITypingRetryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
