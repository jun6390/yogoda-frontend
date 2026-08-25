import type { HTMLAttributes, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "../Badge/Badge";

import { cn } from "@/lib/utils";

type BenefitRowType = "default" | "free" | "price";

interface BenefitRowProps extends HTMLAttributes<HTMLDivElement> {
  type?: BenefitRowType;
  iconLabel?: ReactNode;
  iconClassName?: string;
  name: ReactNode;
  description: ReactNode;
  value?: ReactNode;
}

export function BenefitRow({
  type = "default",
  iconLabel = "N",
  iconClassName,
  name,
  description,
  value,
  className,
  ...props
}: BenefitRowProps) {
  const t = useTranslations("Rows");

  const right =
    value ??
    (type === "default" ? (
      <Badge variant="price">D-7</Badge>
    ) : type === "free" ? (
      t("free")
    ) : (
      t("defaultPrice")
    ));

  return (
    <div
      className={cn(
        "flex w-full max-w-[350px] items-center justify-between gap-lg",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-md">
        <span
          className={cn(
            "flex size-[32px] shrink-0 items-center justify-center rounded-sm bg-brand-soft font-sans text-label-14-bold text-icon-brand",
            iconClassName,
          )}
        >
          {iconLabel}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-sans text-label-14-medium text-text-primary">
            {name}
          </span>
          <span className="block truncate font-sans text-caption-12-regular text-text-secondary">
            {description}
          </span>
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 font-sans text-label-14-bold text-action-primary",
          type === "price" && "text-text-primary",
        )}
      >
        {right}
      </span>
    </div>
  );
}
