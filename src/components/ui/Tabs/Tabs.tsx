"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface TabItem<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  items: readonly TabItem<T>[];
  active: T;
  onValueChange?: (value: T) => void;
  ariaLabel?: string;
}

export function Tabs<T extends string>({
  items,
  active,
  onValueChange,
  ariaLabel = "서브 메뉴",
  className,
  ...props
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex h-touch w-full items-center border-b border-border-default bg-surface",
        className,
      )}
      {...props}
    >
      {items.map((tab) => {
        const isActive = active === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange?.(tab.value)}
            className={cn(
              "relative flex h-full flex-1 items-center justify-center",
              "font-sans text-caption-13-medium text-text-secondary",
              "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-action-primary",
              isActive && "text-caption-13-bold text-action-primary",
            )}
          >
            {tab.label}

            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-action-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
