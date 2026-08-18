import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: ReactNode;
}

export function Chip({
  selected = false,
  disabled = false,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-[42px] items-center justify-center rounded-full px-lg",
        "font-sans text-caption-12-regular whitespace-nowrap",
        "outline-none transition-colors",

        /*
         * Default 상태임
         * Figma: Surface 배경 + Border Default + Primary Text
         */
        !selected &&
          !disabled &&
          "border border-border-default bg-surface text-text-primary",

        /*
         * Selected 상태임
         * Figma: Primary 배경 + On Primary Text
         */
        selected &&
          !disabled &&
          "border border-transparent bg-action-primary text-text-on-primary",

        /*
         * Disabled 상태임
         * Figma: Subtle 배경 + Border Default + Tertiary Text
         */
        disabled &&
          "cursor-not-allowed border border-border-default bg-surface-subtle text-text-tertiary",

        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
