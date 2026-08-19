import type { HTMLAttributes, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface PlanRowProps extends HTMLAttributes<HTMLDivElement> {
  recommended?: boolean;
  name: ReactNode;
  price: ReactNode;
  description: ReactNode;
}

export function PlanRow({
  recommended = false,
  name,
  price,
  description,
  className,
  ...props
}: PlanRowProps) {
  const t = useTranslations("Rows");

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-sm rounded-lg bg-surface p-lg",
        "border border-border-strong",
        recommended && "border-2 border-action-primary",
        className,
      )}
      {...props}
    >
      <div className="flex w-full items-center justify-between gap-md">
        <p className="min-w-0 truncate font-sans text-label-14-bold text-text-primary">
          {name}
        </p>

        {recommended ? (
          <span className="shrink-0 rounded-xs bg-brand-soft px-sm py-[2px] font-sans text-micro-11-bold text-text-brand">
            {t("aiRecommended")}
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "font-sans text-label-14-bold text-text-primary",
          recommended && "text-action-primary",
        )}
      >
        {price}
      </p>

      <p className="font-sans text-micro-11-regular text-text-secondary">
        {description}
      </p>
    </div>
  );
}
