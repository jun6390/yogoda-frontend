import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-action-primary text-text-on-primary hover:bg-action-primary-hover",

  secondary:
    "border border-border-default bg-surface text-text-primary hover:bg-surface-subtle",

  text: "bg-background text-text-brand hover:bg-brand-soft",
};

/*
 * components/ui/Button과 스타일은 동일하게 맞추되, useTranslations 의존을 없앤 버전임
 * 어드민 트리에는 NextIntlClientProvider가 없어서 기존 Button을 그대로 쓰면 렌더링 시 에러가 남
 */
export function Button({
  variant = "primary",
  loading = false,
  loadingLabel = "처리 중...",
  disabled = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-2xl py-lg text-title-16-bold",
        "transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
        variantStyles[variant],

        disabled &&
          "cursor-not-allowed bg-border-default text-text-tertiary hover:bg-border-default",

        loading && "cursor-wait opacity-70",

        className,
      )}
      {...props}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
