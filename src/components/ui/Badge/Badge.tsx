import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "accent" | "success" | "price" | "error";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-sm py-xs",
        "font-sans text-micro-11-bold whitespace-nowrap",

        /*
         * Figma Badge V2의 각 용도별 Semantic Token을 그대로 사용함
         */
        variant === "default" && "bg-background text-text-secondary",

        variant === "accent" && "bg-brand-soft text-action-primary",

        variant === "success" && "bg-success-soft text-success",

        variant === "price" && "bg-background text-action-primary",

        variant === "error" && "bg-error-soft text-error",

        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
