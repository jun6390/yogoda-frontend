import type { HTMLAttributes, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { FigmaImage } from "../FigmaImage/FigmaImage";

import { cn } from "@/lib/utils";

interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  message: ReactNode;
  actionLabel?: ReactNode;
}

const checkCircleIcon = "/figma-assets/icon-check-circle.svg";

export function Toast({
  message,
  actionLabel,
  className,
  ...props
}: ToastProps) {
  const t = useTranslations("Toast");
  const resolvedActionLabel =
    actionLabel === undefined ? t("defaultActionLabel") : actionLabel;

  return (
    <div
      role="status"
      className={cn(
        "flex h-[48px] w-[342px] items-center justify-between gap-lg rounded-lg bg-toast-background px-lg shadow-lg",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-sm">
        <FigmaImage
          alt=""
          src={checkCircleIcon}
          className="size-[18px] shrink-0"
        />
        <span className="truncate font-sans text-caption-13-bold text-text-on-primary">
          {message}
        </span>
      </span>
      {resolvedActionLabel ? (
        <button
          type="button"
          className="shrink-0 rounded-sm bg-white/10 px-md py-sm font-sans text-caption-12-bold text-toast-action-text"
        >
          {resolvedActionLabel}
        </button>
      ) : null}
    </div>
  );
}
