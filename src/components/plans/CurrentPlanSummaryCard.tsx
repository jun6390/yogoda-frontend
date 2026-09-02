"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { PlanVisual } from "./PlanVisual";

import { Link } from "@/i18n/navigation";

interface CurrentPlanSummaryCardProps {
  href: `/plans/${string}` | "/my/plan";
  planName: string;
  monthlyFeeLabel: string;
  dataLabel: string;
  voiceLabel: string;
  selectedBenefitCount: number;
  joinedAtLabel: string | null;
}

export function CurrentPlanSummaryCard({
  href,
  planName,
  monthlyFeeLabel,
  dataLabel,
  voiceLabel,
  selectedBenefitCount,
  joinedAtLabel,
}: CurrentPlanSummaryCardProps) {
  const t = useTranslations("Home");

  return (
    <Link
      href={href}
      className="relative flex min-h-[210px] flex-col gap-lg rounded-lg border border-border-default bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
    >
      <ChevronRight
        aria-hidden="true"
        className="absolute right-lg top-lg text-icon-secondary"
        size={18}
      />

      <span className="font-sans text-caption-12-bold text-text-secondary">
        {t("currentPlanEyebrow")}
      </span>

      <div className="flex items-start justify-between gap-lg">
        <div className="min-w-0">
          <h2 className="truncate font-sans text-title-20-bold text-text-primary">
            {planName}
          </h2>
          <p className="mt-xs font-sans text-caption-13-bold text-action-primary">
            {monthlyFeeLabel}
          </p>
          {joinedAtLabel && (
            <p className="mt-xs font-sans text-micro-11-regular text-text-tertiary">
              {t("currentPlanJoinedAt", { date: joinedAtLabel })}
            </p>
          )}
        </div>

        <div className="mr-2xl shrink-0">
          <PlanVisual planName={planName} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-sm">
        <PlanStat label={t("currentPlanData")} value={dataLabel} />
        <PlanStat label={t("currentPlanVoice")} value={voiceLabel} />
        <PlanStat
          label={t("currentPlanBenefits")}
          value={t("currentPlanBenefitCount", {
            count: selectedBenefitCount,
          })}
        />
      </div>
    </Link>
  );
}

function PlanStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-surface-subtle px-sm py-md">
      <p className="truncate font-sans text-micro-11-regular text-text-tertiary">
        {label}
      </p>
      <p className="mt-xs truncate font-sans text-caption-12-bold text-text-primary">
        {value}
      </p>
    </div>
  );
}
