import type { HTMLAttributes } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type AIStateStatus = "thinking" | "streaming" | "done" | "error" | "retry";

interface AIStateProps extends HTMLAttributes<HTMLDivElement> {
  status?: AIStateStatus;
}

const aiStateWidth: Record<AIStateStatus, string> = {
  thinking: "w-[165px]",
  streaming: "w-[140px]",
  done: "w-[116px]",
  error: "w-[175px]",
  retry: "w-[175px]",
};

export function AIState({
  status = "thinking",
  className,
  ...props
}: AIStateProps) {
  const t = useTranslations("AIState");

  return (
    <div
      className={cn(
        "inline-flex h-[48px] items-center rounded-md px-md",
        "bg-ai-soft font-sans text-caption-12-medium text-text-primary",
        aiStateWidth[status],
        status === "streaming" && "bg-brand-soft text-text-brand",
        status === "done" && "bg-success-soft text-success",
        (status === "error" || status === "retry") &&
          "bg-error-soft text-error",
        className,
      )}
      {...props}
    >
      {t(status)}
    </div>
  );
}
