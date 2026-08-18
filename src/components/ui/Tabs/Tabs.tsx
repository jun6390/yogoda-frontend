import type { HTMLAttributes } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type TabValue = "home" | "attendance" | "twoPlus";

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  active?: TabValue;
  onValueChange?: (value: TabValue) => void;
}

const tabs: Array<{
  value: TabValue;
  labelKey: TabValue;
  indicatorWidth: string;
}> = [
  { value: "home", labelKey: "home", indicatorWidth: "w-[51px]" },
  { value: "attendance", labelKey: "attendance", indicatorWidth: "w-[36px]" },
  { value: "twoPlus", labelKey: "twoPlus", indicatorWidth: "w-[60px]" },
];

export function Tabs({
  active = "home",
  onValueChange,
  className,
  ...props
}: TabsProps) {
  const t = useTranslations("Tabs");

  return (
    <div
      role="tablist"
      aria-label={t("ariaLabel")}
      className={cn(
        "flex h-touch w-full items-center border-b border-border-default bg-surface",
        className,
      )}
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange?.(tab.value)}
            className={cn(
              "relative flex h-full flex-1 items-center justify-center font-sans text-caption-13-medium text-text-secondary",
              "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-action-primary",
              isActive && "text-caption-13-bold text-action-primary",
            )}
          >
            {t(tab.labelKey)}
            {isActive ? (
              <span
                className={cn(
                  "absolute bottom-0 h-[2px] rounded-full bg-action-primary",
                  tab.indicatorWidth,
                )}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
