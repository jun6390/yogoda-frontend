"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { NergetPlanBadge } from "@/components/plans/NergetPlanBadge";
import { Badge } from "@/components/ui/Badge/Badge";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface PlanRowProps extends HTMLAttributes<HTMLDivElement> {
  recommended?: boolean;
  name: ReactNode;
  planNumber?: string | number;
  price: ReactNode;
  description: ReactNode;
  subDescription?: ReactNode;
  benefits?: string[];
  href?: string;
  promotionBadge?: string | null;
  currentPlanBadge?: string | null;
  effectiveMonthlyFee?: number | null;
  maxMonthlyBenefit?: number | null;
}

export function PlanRow({
  recommended = false,
  name,
  planNumber,
  price,
  description,
  subDescription,
  benefits = [],
  href,
  promotionBadge,
  currentPlanBadge,
  effectiveMonthlyFee,
  maxMonthlyBenefit,
  className,
  ...props
}: PlanRowProps) {
  const t = useTranslations("Rows");
  const locale = useLocale();

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale).format(value);
  const hasEffectivePrice =
    effectiveMonthlyFee !== null && effectiveMonthlyFee !== undefined;

  const mainContent = (
    <div className="px-lg pb-md pt-lg">
      <div className="flex items-start justify-between gap-lg">
        <div className="min-w-0 flex-1">
          {(currentPlanBadge || promotionBadge) && (
            <div className="mb-sm flex flex-wrap items-center gap-xs">
              {currentPlanBadge && (
                <Badge variant="accent" className="h-[22px] py-0 leading-none">
                  {currentPlanBadge}
                </Badge>
              )}

              {promotionBadge && (
                <Badge variant="default" className="h-[22px] py-0 leading-none">
                  {promotionBadge}
                </Badge>
              )}
            </div>
          )}

          {hasEffectivePrice && (
            <p className="font-sans text-caption-13-medium text-text-primary">
              <span className="font-sans text-label-14-bold text-action-primary">
                {t("effectivePrice")}{" "}
              </span>

              <strong className="font-sans text-label-14-bold text-text-primary">
                {formatNumber(effectiveMonthlyFee)}
              </strong>

              {t("perMonth")}
            </p>
          )}

          <p
            className={cn(
              "font-sans text-text-primary",
              hasEffectivePrice
                ? "mt-xs text-micro-11-regular line-through"
                : "text-label-14-bold",
            )}
          >
            {price}
          </p>
        </div>

        {planNumber !== undefined && (
          <NergetPlanBadge number={planNumber} size="sm" />
        )}
      </div>

      <div className="mt-lg flex items-center justify-between gap-md">
        <div className="min-w-0">
          <p className="font-sans text-label-14-bold text-text-primary">
            {description}
          </p>

          {subDescription && (
            <p className="mt-xs font-sans text-micro-11-regular text-text-secondary">
              {subDescription}
            </p>
          )}

          <span className="sr-only">{name}</span>

          {recommended && <span className="sr-only">{t("aiRecommended")}</span>}
        </div>

        {href && (
          <ChevronRight
            aria-hidden="true"
            size={18}
            className="shrink-0 text-icon-secondary"
          />
        )}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg border border-border-default bg-surface shadow-sm",
        className,
      )}
      {...props}
    >
      {href ? (
        <Link href={href} className="block">
          {mainContent}
        </Link>
      ) : (
        mainContent
      )}

      {maxMonthlyBenefit !== null && maxMonthlyBenefit !== undefined && (
        <details className="group">
          <summary className="mx-lg flex cursor-pointer list-none items-center justify-between border-t border-border-default py-md">
            <p className="font-sans text-micro-11-regular text-text-secondary">
              {t.rich("maxMonthlyBenefit", {
                amount: formatNumber(maxMonthlyBenefit),
                strong: (chunks) => (
                  <strong className="font-sans text-caption-13-bold text-text-primary">
                    {chunks}
                  </strong>
                ),
              })}
            </p>

            <ChevronDown
              aria-hidden="true"
              size={17}
              className="shrink-0 text-text-secondary transition-transform group-open:rotate-180"
            />
          </summary>

          {benefits.length > 0 && (
            <ul className="flex flex-col gap-sm px-lg pb-lg">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-sm">
                  <span
                    aria-hidden="true"
                    className="w-[4px] shrink-0 font-sans text-micro-11-regular leading-relaxed text-text-secondary"
                  >
                    ·
                  </span>

                  <span className="min-w-0 flex-1 font-sans text-micro-11-regular leading-relaxed text-text-secondary">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </details>
      )}
    </div>
  );
}
