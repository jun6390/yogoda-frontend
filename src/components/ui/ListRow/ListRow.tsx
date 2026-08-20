import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ListRowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  trailing?: ReactNode;
}

export function ListRow({
  children,
  trailing = "›",
  className,
  ...props
}: ListRowProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-[350px] items-center justify-between gap-lg bg-surface py-md",
        "text-left font-sans text-label-14-medium text-text-primary",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
      <span className="shrink-0 text-body-14-regular text-text-tertiary">
        {trailing}
      </span>
    </button>
  );
}
