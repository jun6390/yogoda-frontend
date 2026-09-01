import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "./Button";

import { cn } from "@/lib/utils";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  heading: ReactNode;
  description: ReactNode;
  primaryLabel: ReactNode;
  secondaryLabel?: ReactNode;
  primaryLoading?: boolean;
  onClose?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onPrimaryClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onSecondaryClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
}

/*
 * components/ui/Modal과 구조/스타일은 동일하게 맞추되, useTranslations 의존을 없앤 버전임
 * (Button과 같은 이유 — 어드민 트리엔 NextIntlClientProvider가 없음)
 */
export function Modal({
  icon,
  heading,
  description,
  primaryLabel,
  secondaryLabel = "취소",
  primaryLoading = false,
  onClose,
  onPrimaryClick,
  onSecondaryClick,
  className,
  ...props
}: ModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "relative flex w-[calc(100vw-40px)] max-w-content flex-col items-center rounded-2xl bg-surface p-2xl text-center shadow-md",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute right-2xl top-2xl flex size-touch items-center justify-center text-text-secondary"
      >
        <X size={20} aria-hidden="true" />
      </button>
      <div className="h-3xl" />
      <div className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-text-brand">
        {icon}
      </div>
      <h2 className="mt-lg font-sans text-title-16-bold text-text-primary">
        {heading}
      </h2>
      <p className="whitespace-pre-line py-2xl font-sans text-body-14-regular text-text-secondary">
        {description}
      </p>
      <Button
        className="h-12 w-full rounded-lg"
        loading={primaryLoading}
        onClick={onPrimaryClick}
      >
        {primaryLabel}
      </Button>
      <button
        type="button"
        className="mt-md font-sans text-label-14-bold text-text-secondary"
        onClick={onSecondaryClick}
      >
        {secondaryLabel}
      </button>
    </div>
  );
}
