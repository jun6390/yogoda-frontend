import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserChatBubbleProps {
  children: ReactNode;
  className?: string;
}

interface AIChatBubbleProps {
  children: ReactNode;
  className?: string;
  noBackground?: boolean;
}

// 사용자 말풍선 컴포넌트 정의
export function UserChatBubble({ children, className }: UserChatBubbleProps) {
  return (
    <div className="flex w-full justify-end items-start gap-sm">
      <div
        className={cn(
          "rounded-[12px] rounded-tr-[4px] px-lg py-md font-sans text-body-14-regular whitespace-pre-line break-words shadow-sm",
          "bg-action-primary text-text-on-primary max-w-[80%]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

// AI 말풍선 컴포넌트
export function AIChatBubble({
  children,
  className,
  noBackground = false,
}: AIChatBubbleProps) {
  return (
    <div className="flex w-full justify-start items-start gap-sm">
      <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-ai-soft text-text-brand mt-[2px]">
        <Sparkles size={16} />
      </span>
      <div
        className={cn(
          !noBackground &&
            "rounded-[12px] rounded-tl-[4px] px-lg py-md bg-surface text-text-primary border border-border-default shadow-sm",
          "font-sans text-body-14-regular whitespace-pre-line break-words max-w-[85%]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
