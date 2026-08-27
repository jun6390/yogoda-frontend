"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { PageSpinner } from "@/components/ui/Spinner/Spinner";
import { Button } from "@/components/ui/Button/Button";
import { useRouter } from "@/i18n/navigation";
import { getCurrentPlan, getPlanByCode } from "@/lib/api/plan";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Plan } from "@/types/plan";

type CompareRow = {
  label: string;
  current: string;
  selected: string;
};

function formatPerks(perks: string[], noneLabel: string): string {
  if (perks.length === 0) return noneLabel;
  const shown = perks.slice(0, 2).join(", ");
  return perks.length > 2 ? `${shown} 외 ${perks.length - 2}개` : shown;
}

function dataDisplay(plan: Plan, unlimitedLabel: string): string {
  return plan.data.amountMb === null ? unlimitedLabel : plan.data.display;
}

export default function PlanComparePage() {
  const t = useTranslations("PlanCompare");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const accessToken = useAuthStore((state) => state.accessToken);

  const fmt = (value: number) => new Intl.NumberFormat(locale).format(value);

  const { data: currentPlan, isPending: isCurrentPending } = useQuery({
    queryKey: ["plans", "me", "current"],
    queryFn: getCurrentPlan,
    enabled: Boolean(accessToken),
  });

  const { data: currentPlanDetail, isPending: isCurrentDetailPending } =
    useQuery({
      queryKey: ["plans", currentPlan?.planCode],
      queryFn: () => getPlanByCode(currentPlan!.planCode),
      enabled: Boolean(currentPlan?.planCode),
    });

  const {
    data: selectedPlan,
    isPending: isSelectedPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["plans", code],
    queryFn: () => getPlanByCode(code!),
    enabled: Boolean(code),
  });

  if (isCurrentPending || isCurrentDetailPending || isSelectedPending) {
    return <PageSpinner label={t("loading")} />;
  }

  if (isError || !selectedPlan || !code) {
    return (
      <PageContainer className="py-xl">
        <ErrorState
          title={t("error")}
          retryLabel={t("retry")}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const noneLabel = t("none");
  const unlimitedLabel = t("unlimited");
  const monthlyFeeLabel = t("monthlyFee");

  // 음수 = 추천 요금제가 더 쌈
  const feeDiff = currentPlanDetail
    ? selectedPlan.monthlyFee - currentPlanDetail.monthlyFee
    : null;

  const allRows: CompareRow[] = [
    {
      label: monthlyFeeLabel,
      current: currentPlanDetail
        ? `${fmt(currentPlanDetail.monthlyFee)}원`
        : "-",
      selected: `${fmt(selectedPlan.monthlyFee)}원`,
    },
    {
      label: t("network"),
      current: currentPlanDetail?.network ?? "-",
      selected: selectedPlan.network,
    },
    {
      label: t("data"),
      current: currentPlanDetail
        ? dataDisplay(currentPlanDetail, unlimitedLabel)
        : "-",
      selected: dataDisplay(selectedPlan, unlimitedLabel),
    },
    {
      label: t("voice"),
      current: currentPlanDetail?.voice ?? "-",
      selected: selectedPlan.voice,
    },
    {
      label: t("additionalVoice"),
      current: currentPlanDetail?.additionalVoice ?? noneLabel,
      selected: selectedPlan.additionalVoice ?? noneLabel,
    },
    {
      label: t("sms"),
      current: currentPlanDetail?.sms ?? "-",
      selected: selectedPlan.sms,
    },
    {
      label: t("tethering"),
      current: currentPlanDetail?.data.sharingDisplay ?? noneLabel,
      selected: selectedPlan.data.sharingDisplay ?? noneLabel,
    },
    {
      label: t("familyData"),
      current: currentPlanDetail?.data.familyDataDisplay ?? noneLabel,
      selected: selectedPlan.data.familyDataDisplay ?? noneLabel,
    },
    {
      label: t("membership"),
      current: currentPlanDetail?.membershipTier ?? noneLabel,
      selected: selectedPlan.membershipTier ?? noneLabel,
    },
    {
      label: t("perks"),
      current: formatPerks(currentPlanDetail?.perks ?? [], noneLabel),
      selected: formatPerks(selectedPlan.perks, noneLabel),
    },
  ];

  const diffRows = currentPlanDetail
    ? allRows.filter(
        (row) => row.current !== row.selected && row.label !== monthlyFeeLabel,
      )
    : allRows.filter((row) => row.label !== monthlyFeeLabel);

  const ctaNote =
    feeDiff === null
      ? null
      : feeDiff < 0
        ? t("ctaSavingsNote", { amount: fmt(Math.abs(feeDiff)) })
        : feeDiff > 0
          ? t("ctaExpensiveNote", { amount: fmt(feeDiff) })
          : t("ctaSameNote");

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-[56px] shrink-0 items-center gap-sm border-b border-border-default bg-surface px-lg">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t("back")}
          className="flex size-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-surface-subtle"
        >
          <ArrowLeft aria-hidden="true" size={21} />
        </button>
        <h1 className="font-sans text-title-16-bold text-text-primary">
          {t("title")}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-[148px]">
        <PageContainer className="py-xl">
          <p className="whitespace-pre-line font-sans text-title-24-bold leading-snug text-text-primary">
            {t("heroText")}
          </p>

          <div className="mt-xl grid grid-cols-2 divide-x divide-border-default">
            <div className="pr-lg">
              <span className="inline-block rounded-full bg-surface-subtle px-sm py-xs font-sans text-micro-11-bold text-text-secondary">
                {t("currentBadge")}
              </span>
              <p className="mt-sm font-sans text-label-14-bold leading-snug text-text-primary">
                {currentPlanDetail?.name ?? t("myPlan")}
              </p>
              <p
                className={`mt-xs font-sans text-title-20-bold ${feeDiff !== null && feeDiff > 0 ? "text-action-primary" : "text-text-primary"}`}
              >
                {currentPlanDetail
                  ? `${fmt(currentPlanDetail.monthlyFee)}원`
                  : "-"}
              </p>
            </div>

            <div className="pl-lg">
              <span className="inline-flex items-center gap-[3px] rounded-full bg-action-primary/10 px-sm py-xs font-sans text-micro-11-bold text-action-primary">
                <Sparkles size={10} aria-hidden="true" />
                {t("aiBadge")}
              </span>
              <p className="mt-sm font-sans text-label-14-bold leading-snug text-text-primary">
                {selectedPlan.name}
              </p>
              <p
                className={`mt-xs font-sans text-title-20-bold ${feeDiff !== null && feeDiff < 0 ? "text-action-primary" : "text-text-primary"}`}
              >
                {fmt(selectedPlan.monthlyFee)}원
              </p>
              {feeDiff !== null && feeDiff !== 0 && (
                <p className="mt-xs font-sans text-caption-12-medium text-text-tertiary">
                  {feeDiff < 0
                    ? t("ctaSavingsNote", { amount: fmt(Math.abs(feeDiff)) })
                    : t("ctaExpensiveNote", { amount: fmt(feeDiff) })}
                </p>
              )}
            </div>
          </div>

          <div className="mt-2xl overflow-hidden rounded-xl border border-border-default bg-surface">
            <div className="grid grid-cols-[80px_1fr_1fr] border-b-2 border-border-default bg-surface-subtle px-md py-md">
              <span />
              <span className="font-sans text-caption-13-bold text-text-primary">
                {currentPlanDetail?.name ?? t("myPlan")}
              </span>
              <span className="font-sans text-caption-13-bold text-text-primary">
                {selectedPlan.name}
              </span>
            </div>

            {diffRows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[80px_1fr_1fr] items-start gap-sm px-md py-md ${i !== diffRows.length - 1 ? "border-b border-border-default" : ""}`}
              >
                <span className="pt-[2px] font-sans text-caption-12-regular leading-snug text-text-secondary">
                  {row.label}
                </span>
                <span className="font-sans text-caption-13-medium leading-snug break-keep text-text-secondary">
                  {row.current}
                </span>
                <span className="font-sans text-caption-13-bold leading-snug break-keep text-action-primary">
                  {row.selected}
                </span>
              </div>
            ))}

            {feeDiff !== null && (
              <div className="grid grid-cols-[80px_1fr_1fr] items-center border-t border-border-default bg-surface-subtle px-md py-md">
                <span className="font-sans text-caption-12-medium text-text-tertiary">
                  {t("comparison")}
                </span>
                <span
                  className={`font-sans text-caption-13-bold ${feeDiff > 0 ? "text-action-primary" : "text-text-tertiary"}`}
                >
                  유지
                </span>
                <span
                  className={`font-sans text-caption-13-bold ${feeDiff < 0 ? "text-action-primary" : "text-text-secondary"}`}
                >
                  {feeDiff === 0
                    ? t("same")
                    : feeDiff > 0
                      ? t("more", { amount: fmt(feeDiff) })
                      : t("cheaper", { amount: fmt(Math.abs(feeDiff)) })}
                </span>
              </div>
            )}
          </div>
        </PageContainer>
      </div>

      <div className="fixed bottom-[72px] left-1/2 z-20 w-full max-w-[446px] -translate-x-1/2 rounded-t-[20px] bg-surface shadow-[0_-8px_28px_rgb(18_20_31_/_12%)]">
        <div className="px-lg pb-lg pt-lg">
          <div className="mb-xl flex items-center justify-between gap-lg">
            <span className="font-sans text-title-20-bold text-text-primary">
              {selectedPlan.name}
            </span>
            <div className="text-right">
              <strong className="font-sans text-title-18-bold text-text-primary">
                {fmt(selectedPlan.monthlyFee)}원/월
              </strong>
              {ctaNote && (
                <p
                  className={`mt-[2px] font-sans text-micro-11-medium ${feeDiff !== null && feeDiff < 0 ? "text-success" : feeDiff !== null && feeDiff > 0 ? "text-action-primary" : "text-text-tertiary"}`}
                >
                  {ctaNote}
                </p>
              )}
            </div>
          </div>
          <Button
            className="h-[56px] w-full rounded-xl"
            onClick={() => router.push(`/plans/${code}`)}
          >
            {t("selectPlan")}
          </Button>
        </div>
      </div>
    </div>
  );
}
