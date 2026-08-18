import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-action-primary text-text-on-primary hover:bg-action-primary-hover",

  secondary:
    "border border-border-default bg-surface text-text-primary hover:bg-surface-subtle",

  text: "bg-background text-text-brand hover:bg-brand-soft",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const t = useTranslations("Common");
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

        /*
         * disabled와 loading은 디자인 종류가 아니라 상태임
         * variant와 분리해서 관리함
         */
        disabled &&
          "cursor-not-allowed bg-border-default text-text-tertiary hover:bg-border-default",

        loading && "cursor-wait opacity-70",

        className,
      )}
      {...props}
    >
      {loading ? t("loading") : children}
    </button>
  );
}
