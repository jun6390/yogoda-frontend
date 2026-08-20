import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { useTranslations } from "next-intl";

import { FigmaImage } from "../FigmaImage/FigmaImage";

import { cn } from "@/lib/utils";

type AITypingIndicatorState = "typing" | "error";

interface AITypingIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  state?: AITypingIndicatorState;
}

const sparklesIcon = "/figma-assets/icon-sparkles.svg";
const typingBubble = "/figma-assets/typing-bubble.svg";

function AIAvatar() {
  return (
    <span className="flex size-[28px] shrink-0 items-center justify-center rounded-md bg-ai-soft">
      <FigmaImage alt="" src={sparklesIcon} className="size-[24px]" />
    </span>
  );
}

export function AITypingIndicator({
  state = "typing",
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
      <AIAvatar />
      {state === "typing" ? (
        <FigmaImage
          alt={t("typingAlt")}
          src={typingBubble}
          className="h-[32px] w-[68px]"
        />
      ) : (
        <div className="flex flex-col gap-sm rounded-bl-lg rounded-br-lg rounded-tl-xs rounded-tr-lg bg-surface-subtle px-lg py-md">
          <p className="font-sans text-body-14-regular text-text-secondary">
            {t("error")}
          </p>
          <button
            type="button"
            className="self-start font-sans text-caption-13-medium text-text-brand underline"
          >
            {common("retry")}
          </button>
        </div>
      )}
    </div>
  );
}

export type AITypingRetryButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement>;
