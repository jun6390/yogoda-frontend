"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  message: ReactNode;
  actionLabel?: ReactNode;
}

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
        <CheckCircle2
          aria-hidden="true"
          size={18}
          className="shrink-0 text-toast-foreground"
        />
        <span className="truncate font-sans text-caption-13-bold text-toast-foreground">
          {message}
        </span>
      </span>
      {resolvedActionLabel ? (
        <button
          type="button"
          className="shrink-0 rounded-sm bg-toast-foreground/30 px-md py-sm font-sans text-caption-12-bold text-toast-action-text"
        >
          {resolvedActionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function FloatingToast(props: ToastProps) {
  return createPortal(
    <Toast
      {...props}
      className={cn(
        "fixed top-[calc(env(safe-area-inset-top)+var(--spacing-lg))] left-1/2 z-[100] max-w-[calc(100%-32px)] -translate-x-1/2 motion-safe:animate-toast-lifecycle",
        props.className,
      )}
    />,
    document.body,
  );
}
