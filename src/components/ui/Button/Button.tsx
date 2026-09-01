import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "text" | "inChat";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

/*
 * 각 variant가 크기(padding·글자 크기·radius)까지 전부 갖고 있음 — 공통 베이스에
 * 크기를 두고 variant별로 색만 얹으면, 같은 CSS 속성(padding 등)에 서로 다른
 * 값을 주는 유틸리티 클래스 두 개가 동시에 붙어 어느 게 이길지 보장할 수 없음
 * (Tailwind는 작성 순서가 아니라 생성된 스타일시트 순서로 우선순위가 정해짐)
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "rounded-lg px-2xl py-lg text-title-16-bold bg-action-primary text-text-on-primary hover:bg-action-primary-hover",

  secondary:
    "rounded-lg px-2xl py-lg text-title-16-bold border border-border-default bg-surface text-text-primary hover:bg-surface-subtle",

  text: "rounded-lg px-2xl py-lg text-title-16-bold bg-background text-text-brand hover:bg-brand-soft",

  /*
   * 채팅 말풍선/카드 안에서만 쓰는, 페이지 하단 고정 CTA보다 눈에 덜 띄는 버튼.
   * (예: 약관 동의 카드의 "다음", 본인 확인 카드의 "본인 확인하기") 크기를 줄이고
   * 꽉 채운 배경 대신 은은한 톤온톤 배경을 씀
   */
  inChat:
    "rounded-md px-lg py-sm text-caption-13-bold bg-brand-soft text-action-primary hover:bg-action-primary/15",
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
        "inline-flex items-center justify-center",
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
