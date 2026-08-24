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

export function AITypingIndicator({
  state = "typing",
  onRetry,
  className,
  ...props
}: AITypingIndicatorProps) {
  const t = useTranslations("AITypingIndicator");
  const common = useTranslations("Common");

  return (
    <div
      className={cn("flex items-end gap-sm", className)}
      aria-live="polite"
      {...props}
    >
      {state === "typing" ? (
        <div className="flex items-center rounded-[12px] rounded-tl-[4px] bg-surface border border-border-default shadow-sm px-lg py-md">
          <div className="flex items-center gap-[4px]">
            <span className="size-[6px] rounded-full bg-text-secondary animate-bounce [animation-delay:-0.3s]" />
            <span className="size-[6px] rounded-full bg-text-secondary animate-bounce [animation-delay:-0.15s]" />
            <span className="size-[6px] rounded-full bg-text-secondary animate-bounce" />
          </div>
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
