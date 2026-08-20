import type { HTMLAttributes, MouseEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  actionLabel?: ReactNode;
  actionAriaLabel?: string;
  onAction?: MouseEventHandler<HTMLButtonElement>;
}

export function SectionHeader({
  children,
  actionLabel,
  actionAriaLabel,
  onAction,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-md",
        className,
      )}
      {...props}
    >
      <h2 className="min-w-0 truncate font-sans text-title-16-bold text-text-primary">
        {children}
      </h2>

      {actionLabel ? (
        <button
          type="button"
          aria-label={actionAriaLabel}
          onClick={onAction}
          className={cn(
            "inline-flex shrink-0 items-center gap-xs whitespace-nowrap",
            "font-sans text-caption-12-medium text-text-tertiary",
            "transition-colors hover:text-text-secondary",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
          )}
        >
          {actionLabel}
          <span aria-hidden="true">›</span>
        </button>
      ) : null}
    </div>
  );
}
