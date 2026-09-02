"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bot, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { HighlightedText } from "@/components/ui/HighlightedText/HighlightedText";
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
import { cn } from "@/lib/utils";
import type { PlanComparisonRow } from "@/types/plan";

// 스켈레톤 텍스트 막대에 쓰는, 좌→우로 흐르는 그라데이션 셰이머 효과.
// 옅은 회색 카드(surface-subtle) 위인지 흰 표면(surface) 위인지에 따라
// 밑색을 다르게 둬서 어느 배경에서도 충분한 대비가 나오게 함
const SHIMMER_ON_SUBTLE_CARD =
  "bg-gradient-to-r from-border-default via-surface to-border-default bg-[length:200%_100%] animate-[skeletonShimmer_1.5s_ease-in-out_infinite]";
const SHIMMER_ON_SURFACE =
  "bg-gradient-to-r from-surface-subtle via-surface to-surface-subtle bg-[length:200%_100%] animate-[skeletonShimmer_1.5s_ease-in-out_infinite]";

export default function PlanComparePage() {
  const t = useTranslations("PlanCompare");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const accessToken = useAuthStore((state) => state.accessToken);

  // 하단 고정 CTA 표시 여부 — 스크롤 감지 로직은 아래 useEffect에 있음
  const [showStickyCta, setShowStickyCta] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ctaTriggerRef = useRef<HTMLDivElement>(null);

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

  // 요금제 상세 페이지와 동일하게, 하단 고정 CTA는 처음부터 항상 떠 있지 않고
  // 어느 정도 스크롤해서 내려야 나타남. selectedPlan이 로딩되기 전엔 이
  // refs를 가진 트리 자체가 아직 안 그려져 있으므로(스피너/에러 화면만
  // 있음), selectedPlan이 준비된 뒤에 다시 붙잡음
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const trigger = ctaTriggerRef.current;
    if (!scrollContainer || !trigger) return;

    const handleScroll = () => {
      const triggerTop = trigger.getBoundingClientRect().top;
      const containerRect = scrollContainer.getBoundingClientRect();

      // 트리거 지점이 화면 위쪽 60% 안에 들어왔을 때 하단 CTA를 띄움
      const showThreshold = containerRect.top + containerRect.height * 0.6;

      setShowStickyCta(triggerTop <= showThreshold);
    };

    const frame = window.requestAnimationFrame(handleScroll);

    scrollContainer.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [selectedPlan]);

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

  const feeDiff = currentPlan
    ? selectedPlan.monthlyFee - currentPlan.monthlyFee
    : null;

  // AI 비교 결과(comparison)는 아직 로딩/에러일 수 있어서, 여기서는 값이
  // 있을 때만 계산함. 히어로 섹션은 이미 확보한 요금제 데이터로 먼저
  // 그리고, 이 값이 필요한 "AI 최종 판단" 카드 쪽만 스켈레톤/에러로 대체함
  const recommendLabel = comparison
    ? comparison.recommendation === "current"
      ? t("recommendCurrent")
      : comparison.recommendation === "selected"
        ? t("recommendSelected")
        : t("recommendTie")
    : null;

  const RecommendIcon = comparison
    ? comparison.recommendation === "selected"
      ? TrendingUp
      : comparison.recommendation === "current"
        ? TrendingDown
        : Minus
    : null;

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

      {/* 채팅으로 돌아가기 버튼은 이 아래 스크롤/하단 CTA 표시 여부와 무관하게
          항상 같은 자리에 떠 있어야 하는 독립적인 요소라 여기서 별도로 그림 */}
      <BackToChatButton />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-37">
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
              <span className="inline-flex items-center gap-0.75 rounded-full bg-action-primary/10 px-sm py-xs font-sans text-micro-11-bold text-action-primary">
                <Bot size={12} aria-hidden="true" />
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

          {/* 하단 고정 CTA를 언제 띄울지 판단하는 기준점 */}
          <div ref={ctaTriggerRef} />

          {/* AI 최종 판단 카드. comparison(AI 응답)은 요금제 정보보다 늦게 오므로,
              로딩 중엔 실제 카드와 같은 모양의 스켈레톤을 먼저 보여줘서
              페이지 전체가 이미 떠 있는 것처럼 느껴지게 함 */}
          {isComparisonPending ? (
            <div className="mt-xl rounded-xl border border-border-default bg-surface-subtle px-lg py-md">
              <div className="flex items-center gap-xs">
                <div className="size-4 animate-pulse rounded-full bg-border-default" />
                <div
                  className={cn("h-3.5 w-28 rounded", SHIMMER_ON_SUBTLE_CARD)}
                />
              </div>
              <div className="mt-sm space-y-xs">
                <div
                  className={cn("h-3 w-full rounded", SHIMMER_ON_SUBTLE_CARD)}
                />
                <div
                  className={cn("h-3 w-4/5 rounded", SHIMMER_ON_SUBTLE_CARD)}
                />
              </div>
            </div>
          ) : isComparisonError || !comparison ? (
            <div className="mt-xl">
              <ErrorState
                title={t("error")}
                retryLabel={t("retry")}
                onRetry={refetchComparison}
              />
            </div>
          ) : (
            <div className="mt-xl rounded-xl border border-action-primary/20 bg-action-primary/5 px-lg py-md">
              <div className="flex items-center gap-xs">
                {RecommendIcon && (
                  <RecommendIcon
                    size={16}
                    className="text-action-primary"
                    aria-hidden="true"
                  />
                )}
                <span className="font-sans text-label-14-bold text-action-primary">
                  {recommendLabel}
                </span>
              </div>
              <p className="mt-sm font-sans text-caption-13-regular leading-relaxed text-text-secondary">
                <HighlightedText text={comparison.summaryReason} />
              </p>
            </div>
          )}

          {/* 항목별 비교 테이블. 헤더(요금제 이름)는 이미 확보한 데이터라 바로 그리고,
              AI가 채우는 행만 로딩 중엔 스켈레톤 막대로 대체함 */}
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

            {isComparisonPending ? (
              <ComparisonRowsSkeleton />
            ) : isComparisonError || !comparison ? (
              <div className="px-md py-lg text-center font-sans text-caption-12-regular text-text-tertiary">
                {t("error")}
              </div>
            ) : (
              comparison.rows.map((row: PlanComparisonRow, i: number) => {
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
              })
            )}

            {/* 선택한 요금제 열 강조 외곽선. 행마다 마진으로 짜맞추면 어긋나기 쉬워서,
                테이블 전체를 감싸는 절대위치 박스 하나로 맨 위에 한 번에 그림.
                위아래·오른쪽에 살짝 여백을 둬서 4모서리를 전부 둥글게 통일하고,
                은은한 빛 번짐(glow) 효과도 추가함.
                72px 라벨 열 다음, 남은 폭을 1fr씩 반으로 나눈 뒤쪽 절반이 이 열의 위치임.
                실제 행이 있을 때만 그림 (스켈레톤/에러 상태에선 숨김) */}
            {!isComparisonPending && !isComparisonError && comparison && (
              <div
                className="pointer-events-none absolute inset-y-0.5 right-1 rounded-lg border-2 border-action-primary shadow-[0_0_10px_2px_rgba(224,20,133,0.35)]"
                style={{ left: "calc(72px + (100% - 72px) / 2 + 4px)" }}
              />
            )}
          </div>
        </PageContainer>
      </div>

      {/* 하단 고정 CTA. 요금제 상세 페이지와 동일하게 스크롤을 어느 정도 내려야 나타남 */}
      {showStickyCta && (
        <div className="fixed bottom-[72px] left-1/2 z-20 w-full max-w-111.5 -translate-x-1/2 rounded-t-xl bg-surface shadow-[0_-8px_28px_rgb(18_20_31/12%)]">
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
                  <p className="mt-0.5 font-sans text-micro-11-medium text-success">
                    {t("ctaSavingsNote", { amount: fmt(Math.abs(feeDiff)) })}
                  </p>
                )}
              </div>
            </div>
            <Button
              className="h-[56px] w-full rounded-xl"
              onClick={() => router.push(`/plans/${code}?from=chat`)}
            >
              {t("selectPlan")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// 항목별 비교 테이블 행이 아직 없을 때(AI 응답 대기 중) 보여주는 자리표시자.
// 실제 행과 같은 grid-cols-[72px_1fr_1fr] 구조를 그대로 써서 로딩이 끝나는
// 순간 레이아웃이 튀지 않도록 함
function ComparisonRowsSkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => {
        // 행마다 살짝 시차를 둬서 빛이 위에서 아래로도 흐르는 것처럼 보이게 함.
        // animation-delay는 상속되지 않으므로 막대 하나하나에 직접 줘야 함
        const rowDelay = { animationDelay: `${i * 0.12}s` };

        return (
          <div
            key={i}
            className={`grid grid-cols-[72px_1fr_1fr] items-center gap-sm px-md py-md ${i !== 4 ? "border-b border-border-default" : ""}`}
          >
            <div
              className={cn("mx-auto h-3 w-10 rounded", SHIMMER_ON_SURFACE)}
              style={rowDelay}
            />
            <div
              className={cn("mx-auto h-3.5 w-16 rounded", SHIMMER_ON_SURFACE)}
              style={rowDelay}
            />
            <div
              className={cn("mx-auto h-3.5 w-16 rounded", SHIMMER_ON_SURFACE)}
              style={rowDelay}
            />
          </div>
        );
      })}
    </div>
  );
}
