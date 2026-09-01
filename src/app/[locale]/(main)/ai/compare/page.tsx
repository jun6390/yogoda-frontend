"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { PageSpinner } from "@/components/ui/Spinner/Spinner";
import { Button } from "@/components/ui/Button/Button";
import { BackToChatButton } from "@/components/chat/BackToChatButton";
import { useRouter } from "@/i18n/navigation";
import {
  getCurrentPlan,
  getPlanByCode,
  getAIPlanComparison,
} from "@/lib/api/plan";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PlanComparisonRow } from "@/types/plan";

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

  const currentCode = currentPlan?.planCode ?? null;

  const {
    data: comparison,
    isPending: isComparisonPending,
    isError: isComparisonError,
    refetch: refetchComparison,
  } = useQuery({
    queryKey: ["plans", "ai-compare", currentCode, code],
    queryFn: () => getAIPlanComparison(currentCode!, code!),
    enabled: Boolean(currentCode) && Boolean(code),
    staleTime: 1000 * 60 * 10, // 10분 캐시
  });

  if (isCurrentPending || isSelectedPending) {
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

  if (isComparisonPending) {
    return <PageSpinner label={t("analyzing")} />;
  }

  if (isComparisonError || !comparison) {
    return (
      <PageContainer className="py-xl">
        <ErrorState
          title={t("error")}
          retryLabel={t("retry")}
          onRetry={refetchComparison}
        />
      </PageContainer>
    );
  }

  const feeDiff = currentPlan
    ? selectedPlan.monthlyFee - currentPlan.monthlyFee
    : null;

  const recommendLabel =
    comparison.recommendation === "current"
      ? t("recommendCurrent")
      : comparison.recommendation === "selected"
        ? t("recommendSelected")
        : t("recommendTie");

  const RecommendIcon =
    comparison.recommendation === "selected"
      ? TrendingUp
      : comparison.recommendation === "current"
        ? TrendingDown
        : Minus;

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
          {/* 히어로: 두 요금제 나란히 */}
          <div className="grid grid-cols-2 divide-x divide-border-default">
            <div className="pr-lg">
              <span className="inline-block rounded-full bg-surface-subtle px-sm py-xs font-sans text-micro-11-bold text-text-secondary">
                {t("currentBadge")}
              </span>
              <p className="mt-sm font-sans text-label-14-bold leading-snug text-text-primary">
                {currentPlan?.planName ?? t("myPlan")}
              </p>
              <p className="mt-xs font-sans text-title-20-bold text-text-primary">
                {currentPlan ? `${fmt(currentPlan.monthlyFee)}원` : "-"}
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
              {feeDiff !== null && feeDiff < 0 && (
                <p className="mt-xs font-sans text-caption-12-medium text-text-tertiary">
                  {t("ctaSavingsNote", { amount: fmt(Math.abs(feeDiff)) })}
                </p>
              )}
            </div>
          </div>

          {/* AI 최종 판단 카드 */}
          <div className="mt-xl rounded-xl border border-action-primary/20 bg-action-primary/5 px-lg py-md">
            <div className="flex items-center gap-xs">
              <RecommendIcon
                size={16}
                className="text-action-primary"
                aria-hidden="true"
              />
              <span className="font-sans text-label-14-bold text-action-primary">
                {recommendLabel}
              </span>
            </div>
            <p className="mt-sm font-sans text-caption-13-regular leading-relaxed text-text-secondary">
              {comparison.summaryReason}
            </p>
          </div>

          {/* 항목별 비교 테이블 */}
          <div className="relative mt-xl overflow-hidden rounded-xl border border-border-default bg-surface">
            <div className="grid grid-cols-[72px_1fr_1fr] border-b-2 border-border-default bg-surface-subtle px-md py-sm">
              <span />
              <span className="text-center font-sans text-caption-12-bold text-text-secondary">
                {currentPlan?.planName ?? t("myPlan")}
              </span>
              <span className="text-center font-sans text-caption-12-bold text-action-primary">
                {selectedPlan.name}
              </span>
            </div>

            {comparison.rows.map((row: PlanComparisonRow, i: number) => {
              const isLast = i === comparison.rows.length - 1;
              // 선택한 요금제가 더 좋을 때만 강조함 (기존 요금제가 더 좋아도 별도 강조 없음)
              const selectedWins = row.winner === "selected";

              return (
                <div
                  key={`${row.label}-${i}`}
                  className={`grid grid-cols-[72px_1fr_1fr] items-center gap-sm px-md py-md ${!isLast ? "border-b border-border-default" : ""}`}
                >
                  <span className="text-center font-sans text-micro-11-regular leading-snug text-text-tertiary">
                    {row.label}
                  </span>

                  <div className="text-center">
                    <span className="font-sans text-caption-13-medium leading-snug break-keep text-text-secondary">
                      {row.current}
                    </span>
                  </div>

                  <div className="text-center">
                    <span
                      className={`font-sans text-caption-13-medium leading-snug break-keep ${
                        selectedWins
                          ? "text-action-primary font-bold"
                          : "text-text-secondary"
                      }`}
                    >
                      {row.selected}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* 선택한 요금제 열 강조 외곽선. 행마다 마진으로 짜맞추면 어긋나기 쉬워서,
                테이블 전체를 감싸는 절대위치 박스 하나로 맨 위에 한 번에 그림.
                위아래·오른쪽에 살짝 여백을 둬서 4모서리를 전부 둥글게 통일하고,
                은은한 빛 번짐(glow) 효과도 추가함.
                72px 라벨 열 다음, 남은 폭을 1fr씩 반으로 나눈 뒤쪽 절반이 이 열의 위치임 */}
            <div
              className="pointer-events-none absolute inset-y-0.5 right-1 rounded-lg border-2 border-action-primary shadow-[0_0_10px_2px_rgba(224,20,133,0.35)]"
              style={{ left: "calc(72px + (100% - 72px) / 2 + 4px)" }}
            />
          </div>

          <p className="mt-lg text-center font-sans text-micro-11-regular text-text-tertiary">
            {comparison.oneLineSummary}
          </p>
        </PageContainer>
      </div>

      <BackToChatButton />

      {/* 하단 고정 CTA */}
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
              {feeDiff !== null && feeDiff < 0 && (
                <p className="mt-[2px] font-sans text-micro-11-medium text-success">
                  {t("ctaSavingsNote", { amount: fmt(Math.abs(feeDiff)) })}
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
