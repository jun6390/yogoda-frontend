"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import NextLink from "next/link";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/admin/Button";
import { PeriodTabs } from "@/components/admin/PeriodTabs";
import { Badge } from "@/components/ui/Badge/Badge";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { getDashboard } from "@/lib/api/admin/dashboard";
import { ADMIN_DASHBOARD_QUERY_KEYS } from "@/lib/admin/queryKeys";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { DashboardPeriod, FunnelStage } from "@/types/dashboard";

function formatChange(value: number) {
  const sign = value >= 0 ? "▲" : "▼";
  return `${sign} ${Math.abs(value).toFixed(1)}%p`;
}

// 비교 대상(전기간) 값이 이보다 작으면 증감률이 수천 %처럼 튈 수 있어서
// (예: 1건 → 65건 = +6400%) 증감 배지 대신 "데이터 부족" 문구로 대체함
const MIN_BASELINE_FOR_CHANGE = 5;

/*
 * kpi.*Prev는 캘린더 기준 "저번 주/저번 달"이 아니라, 지금 고른 기간 바로 직전의
 * 같은 길이 구간과 비교한 롤링 값임 (예: 7일 필터면 바로 직전 7일). "전주"/"전월"
 * 라벨은 고정된 달력 단위처럼 오해하게 해서, 그 뜻이 정확히 보이는 라벨로 표시함
 */
function getPrevPeriodLabel(period: DashboardPeriod) {
  if (period === "today") return "전일";
  if (period === "7d") return "직전 7일";
  return "직전 30일";
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// 로그 페이지로 넘어갈 때 대시보드에서 고른 기간(오늘/7일/30일)을 그대로 날짜 필터로 물려줌
function getDateRangeForPeriod(period: DashboardPeriod) {
  const days = period === "today" ? 1 : period === "7d" ? 7 : 30;
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - (days - 1));

  return { startDate: toDateKey(start), endDate: toDateKey(today) };
}

function KpiCard({
  title,
  value,
  unit,
  change,
  prev,
  prevLabel,
  caption,
  badge,
  accent,
}: {
  title: string;
  value: number;
  unit: string;
  // 상담 시작 건수처럼 즉시 확정되는 값만 "전일 대비 증감"으로 비교함. 가입
  // 건수/전환율은 코호트가 며칠에 걸쳐 무르익는 값이라 증감 비교가 오해를
  // 부를 수 있어서, 그 경우엔 change/prev 대신 caption(스냅샷 설명)을 씀
  change?: number;
  prev?: number;
  prevLabel?: string;
  caption?: string;
  // "지금 배포 중" 같은 진짜 활성 상태 표시용. change와 자리를 공유하며 동시에 안 씀
  badge?: ReactNode;
  // 기간 필터가 적용되는 다른 카드들과 성격이 다른 카드임을 색으로도 구분하기 위함
  accent?: boolean;
}) {
  const hasLowBaseline = prev !== undefined && prev < MIN_BASELINE_FOR_CHANGE;

  return (
    <div
      className={cn(
        "flex-1 rounded-lg border border-border-default p-2xl",
        accent ? "bg-brand-soft" : "bg-surface",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="font-sans text-body-14-regular text-text-secondary">
          {title}
        </p>
        {badge}
        {change !== undefined && !hasLowBaseline && (
          <span
            className={cn(
              "font-sans text-caption-12-bold",
              change >= 0 ? "text-success" : "text-error",
            )}
          >
            {formatChange(change)}
          </span>
        )}
      </div>
      <p className="mt-sm font-sans text-title-24-bold text-text-primary">
        {value.toLocaleString("ko-KR")}
        <span className="ml-xs text-title-18-bold text-text-secondary">
          {unit}
        </span>
      </p>
      {prev !== undefined &&
        prevLabel &&
        (hasLowBaseline ? (
          <p className="mt-xs font-sans text-caption-12-regular text-text-tertiary">
            비교할 이전 데이터가 부족해요
          </p>
        ) : (
          <p className="mt-xs font-sans text-caption-12-regular text-text-tertiary">
            {prevLabel} {prev.toLocaleString("ko-KR")}
            {unit}
          </p>
        ))}
      {caption && (
        <p className="mt-xs font-sans text-caption-12-regular text-text-tertiary">
          {caption}
        </p>
      )}
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="flex-1 rounded-lg border border-border-default bg-surface p-2xl">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 animate-pulse rounded-full bg-surface-subtle" />
        <div className="h-4 w-14 animate-pulse rounded-full bg-surface-subtle" />
      </div>
      <div className="mt-sm h-7 w-28 animate-pulse rounded-full bg-surface-subtle" />
      <div className="mt-xs h-3 w-24 animate-pulse rounded-full bg-surface-subtle" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-2xl">
      <div className="flex flex-col gap-2xl sm:flex-row">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      <section className="mt-2xl rounded-lg border border-border-default bg-surface p-2xl">
        <div className="h-5 w-40 animate-pulse rounded-full bg-surface-subtle" />
        <div className="mt-xs h-3 w-56 animate-pulse rounded-full bg-surface-subtle" />

        <div className="mt-lg flex flex-col gap-xs">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-full animate-pulse rounded-md bg-surface-subtle"
            />
          ))}
        </div>
      </section>

      <section className="mt-2xl rounded-lg border border-border-default bg-surface p-2xl">
        <div className="h-5 w-48 animate-pulse rounded-full bg-surface-subtle" />

        <div className="mt-lg flex h-45 items-end justify-center gap-lg">
          {[45, 70, 55, 85].map((heightPercent, index) => (
            <div
              key={index}
              className="w-20 animate-pulse rounded-t-sm bg-surface-subtle"
              style={{ height: `${heightPercent}%` }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export function DashboardContent() {
  // "오늘"은 코호트가 아직 안 익어서(가입 전환에 며칠 걸림) 가입/전환 지표
  // 신뢰도가 낮음 — 기본값을 7일로 둬서 좀 더 성숙한 데이터를 먼저 보여줌
  const [period, setPeriod] = useState<DashboardPeriod>("7d");

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ADMIN_DASHBOARD_QUERY_KEYS.summary(period),
    queryFn: () => getDashboard(period),
  });

  // 배너를 닫으면 그 이탈 단계에 한해서만 숨기고, 데이터가 바뀌어 최다 이탈 단계가
  // 달라지면(기간 변경 등) 다시 보여줌
  const [dismissedStage, setDismissedStage] = useState<string | null>(null);

  // 퍼널 표에서 "AI 채팅 로그 바로가기"는 원래 마우스오버해야 보이는데, 가장
  // 궁금해할 "가입 완료" 단계는 기본값으로 미리 호버된 것처럼 보여줌. 다른
  // 단계에 실제로 마우스를 올리면 그쪽으로 넘어가고, 벗어나면 다시 기본값으로 돌아옴
  const [hoveredStage, setHoveredStage] =
    useState<FunnelStage>("signup_completed");

  // maxDropStage는 "이번 기간 dropRate가 베이스라인(직전 동일 길이 구간) 대비
  // 가장 나빠진 단계"를 서버가 계산해서 내려줌 (아무 단계도 안 나빠졌으면 null).
  // 퍼널 막대그래프 자체는 이 값과 무관하게 stages[]의 실제 값을 그대로 씀
  const maxDropStage = data?.funnel.maxDropStage ?? null;
  const maxDropStageInfo = data?.funnel.stages.find(
    (stage) => stage.stage === maxDropStage,
  );
  const maxDropStageLabel = maxDropStageInfo?.label;

  // 베이스라인 표본이 너무 적으면(예: 5건 미만) "나빠졌다"는 판단 자체가
  // 불안정해서 배너를 안 띄움
  const hasLowBaselineSample =
    maxDropStageInfo !== undefined &&
    maxDropStageInfo.baselineCount < MIN_BASELINE_FOR_CHANGE;

  const showDropStageAlert =
    Boolean(maxDropStageLabel) &&
    !hasLowBaselineSample &&
    maxDropStage !== dismissedStage;

  /*
   * dropRate는 "이전 단계 → 이 단계로 넘어오면서 빠진 비율"이라, 실제로 이탈한 세션의
   * last_stage(=drop_stage 필터값)는 maxDropStage 자신이 아니라 바로 앞 단계임.
   * 예: signup_started의 dropRate가 가장 높다 = plan_comparison_viewed에서 멈춘 세션이 많다는 뜻.
   */
  const maxDropStageIndex =
    data?.funnel.stages.findIndex((stage) => stage.stage === maxDropStage) ??
    -1;
  const actualDropStage =
    maxDropStageIndex > 0
      ? data?.funnel.stages[maxDropStageIndex - 1].stage
      : undefined;

  /*
   * 퍼널 표의 "최다 이탈" 배지는 위 배너(베이스라인 대비 악화)와 다른 질문에 답함 —
   * "이번 기간 실제 dropRate가 어디서 가장 컸나"이므로, maxDropStage(baseline 기준)를
   * 그대로 쓰면 안 되고 이번 기간 절대값으로 따로 계산해야 함. dropRate는 "0~100 크기"가
   * 아니라 "진입률 변화량"이라 빠진 만큼 음수로 내려옴(예: dropRate -70 = 70%p 감소)
   */
  const highestDropStage = data?.funnel.stages.reduce<
    (typeof data.funnel.stages)[number] | undefined
  >((min, stage) => {
    if (stage.dropRate === null || stage.dropRate >= 0) return min;
    if (!min || stage.dropRate < (min.dropRate ?? Infinity)) return stage;
    return min;
  }, undefined);
  const absoluteMaxDropStage = highestDropStage?.stage ?? null;

  const { startDate: logsStartDate, endDate: logsEndDate } =
    getDateRangeForPeriod(period);

  // 대시보드 퍼널 차트에서는 "상담 시작" 단계를 표시하지 않음
  const funnelStages =
    data?.funnel.stages.filter(
      (stage) => stage.stage !== "consultation_started",
    ) ?? [];

  const maxConversionRate = data
    ? Math.max(...data.promptConversion.map((v) => v.conversionRate))
    : 0;

  const activeVersionIndex =
    data?.promptConversion.findIndex((v) => v.isActive) ?? -1;
  const activeVersion =
    activeVersionIndex >= 0
      ? data?.promptConversion[activeVersionIndex]
      : undefined;
  const previousVersion =
    activeVersionIndex > 0
      ? data?.promptConversion[activeVersionIndex - 1]
      : undefined;
  const conversionImprovement =
    activeVersion && previousVersion
      ? activeVersion.conversionRate - previousVersion.conversionRate
      : undefined;

  return (
    <div className="p-3xl">
      <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-title-24-bold text-text-primary">
            대시보드
          </h1>
          <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
            추천에서 가입까지의 전환 흐름을 한눈에 확인하세요
          </p>
        </div>

        <PeriodTabs value={period} onChange={setPeriod} />
      </div>

      {isPending && <DashboardSkeleton />}

      {isError && (
        <ErrorState
          className="mt-2xl"
          title="대시보드를 불러오지 못했어요"
          description={error instanceof ApiError ? error.message : undefined}
          retryLabel="다시 시도"
          onRetry={() => refetch()}
        />
      )}

      {data && (
        <>
          {showDropStageAlert && (
            <div className="mt-2xl flex flex-col gap-md rounded-lg border border-error-soft bg-error-soft px-lg py-md sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-start gap-md">
                <AlertTriangle
                  aria-hidden="true"
                  size={20}
                  className="mt-0.5 shrink-0 text-error"
                />
                <p className="font-sans text-body-14-regular text-text-primary">
                  <strong className="font-sans text-label-14-bold text-error">
                    {maxDropStageLabel}
                  </strong>{" "}
                  단계 이탈률이 직전 기간보다 나빠졌어요
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-md pl-8 sm:ml-auto sm:pl-0">
                {actualDropStage && (
                  <NextLink
                    href={`/admin/logs?drop_stage=${actualDropStage}`}
                    className="shrink-0 font-sans text-caption-12-bold text-text-primary underline underline-offset-2"
                  >
                    해당 로그 보기
                  </NextLink>
                )}

                <NextLink href="/admin/prompts" className="shrink-0">
                  <Button
                    variant="secondary"
                    className="h-7 rounded-md px-md py-0 text-caption-12-bold"
                  >
                    프롬프트 개선하기
                  </Button>
                </NextLink>

                <button
                  type="button"
                  aria-label="배너 닫기"
                  onClick={() => setDismissedStage(maxDropStage)}
                  className="shrink-0 text-text-secondary hover:text-text-primary"
                >
                  <X aria-hidden="true" size={18} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-2xl flex flex-col gap-2xl sm:flex-row">
            <KpiCard
              title="AI 상담 건수"
              value={data.kpi.consultationCount}
              unit="건"
              change={data.kpi.consultationChange}
              prev={data.kpi.consultationPrev}
              prevLabel={getPrevPeriodLabel(period)}
            />
            <KpiCard
              title="AI 추천 가입 건수"
              value={data.kpi.signupCount}
              unit="건"
              caption={`전환하지 않은 상담 ${(data.kpi.consultationCount - data.kpi.signupCount).toLocaleString("ko-KR")}건`}
            />
            {activeVersion && (
              // 날짜 필터(오늘/7일/30일)로 자른 전환율은 최근 상담일수록 전환할
              // 시간이 부족해서 구조적으로 낮게/불안정하게 나옴. 대신 충분히
              // 쌓인 "지금 배포 중인 프롬프트의 전체 기간 누적 전환율"을 필터와
              // 무관하게 보여주므로, 옆 카드들과 헷갈리지 않게 캡션에 명시함
              <KpiCard
                title="현재 버전 전환율"
                value={activeVersion.conversionRate}
                unit="%"
                accent
                badge={
                  <Badge variant="accent">
                    {activeVersion.version} 배포 중
                  </Badge>
                }
                caption={`상담 ${activeVersion.sessionCount.toLocaleString("ko-KR")}건 중 · 날짜 필터 무관`}
              />
            )}
          </div>

          <section className="mt-2xl rounded-lg border border-border-default bg-surface p-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sans text-title-18-bold text-text-primary">
                  추천 → 가입 퍼널
                </h2>
                <p className="mt-xs font-sans text-caption-12-regular text-text-tertiary">
                  각 단계를 클릭하면 해당 대화 로그로 이동합니다
                </p>
              </div>
              <span className="shrink-0 font-sans text-caption-12-regular text-text-tertiary">
                상담 {data.kpi.consultationCount.toLocaleString("ko-KR")}건 중{" "}
                {data.kpi.signupCount.toLocaleString("ko-KR")}건 가입 완료
                (이탈률{" "}
                <strong className="font-sans text-caption-12-bold text-error">
                  {data.funnel.totalDropRate}%
                </strong>
                )
              </span>
            </div>

            <div className="mt-lg hidden items-center gap-x-md px-sm sm:flex">
              <span className="w-43 shrink-0" />
              <span className="flex-1" />
              <span className="w-18 shrink-0 text-right font-sans text-micro-11-regular text-text-tertiary">
                진입률
              </span>
              <span className="w-16 shrink-0 text-right font-sans text-micro-11-regular text-text-tertiary">
                이탈률
              </span>
            </div>

            <div className="mt-xs flex flex-col gap-xs">
              {funnelStages.map((stage, index) => {
                const widthPercent = stage.entryRate;
                const isMaxDrop = stage.stage === absoluteMaxDropStage;
                const isLastStage = index === funnelStages.length - 1;

                /*
                 * dropRate와 마찬가지로, 이 단계에서 이탈한 세션의 drop_stage 값은
                 * 이 단계 자신이 아니라 바로 앞 단계임 (last_stage 기준으로 기록되므로)
                 */
                const stageIndexInFull =
                  data?.funnel.stages.findIndex(
                    (s) => s.stage === stage.stage,
                  ) ?? -1;
                const rowDropStage =
                  stageIndexInFull > 0
                    ? data?.funnel.stages[stageIndexInFull - 1].stage
                    : undefined;
                const logsHref = rowDropStage
                  ? `/admin/logs?drop_stage=${rowDropStage}&start_date=${logsStartDate}&end_date=${logsEndDate}`
                  : undefined;

                const row = (
                  <>
                    <span className="order-1 flex shrink-0 items-center gap-sm whitespace-nowrap sm:w-43">
                      <span className="font-sans text-label-14-bold text-text-primary">
                        {stage.label}
                      </span>
                      {isMaxDrop && (
                        <Badge variant="error" className="shrink-0">
                          최다 이탈
                        </Badge>
                      )}
                    </span>

                    <div className="relative order-5 h-9 w-full overflow-hidden rounded-md bg-border-default sm:order-3 sm:w-auto sm:flex-1">
                      {widthPercent === 0 ? (
                        <span className="flex h-full items-center px-md font-sans text-label-14-bold text-text-tertiary">
                          {stage.count.toLocaleString("ko-KR")}
                        </span>
                      ) : (
                        <div
                          className={cn(
                            "flex h-full items-center gap-xs overflow-hidden rounded-md px-md transition-all",
                            isLastStage
                              ? "bg-text-secondary"
                              : "bg-border-strong",
                          )}
                          style={{ width: `${Math.max(widthPercent, 20)}%` }}
                        >
                          <span
                            className={cn(
                              "truncate font-sans text-label-14-bold",
                              isLastStage
                                ? "text-text-on-primary"
                                : "text-text-primary",
                            )}
                          >
                            {stage.count.toLocaleString("ko-KR")}
                          </span>
                        </div>
                      )}

                      {logsHref && (
                        <span
                          className={cn(
                            "absolute right-xs top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-text-primary px-md py-xs font-sans text-micro-11-bold text-text-on-primary shadow-sm transition-opacity",
                            stage.stage === hoveredStage
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        >
                          AI 채팅 로그 바로가기 →
                        </span>
                      )}
                    </div>

                    <span className="order-3 ml-auto shrink-0 text-right font-sans text-label-14-bold text-text-primary sm:order-4 sm:ml-0 sm:w-18">
                      {stage.entryRate}%
                    </span>

                    <span
                      className={cn(
                        "order-4 shrink-0 text-right font-sans text-caption-12-regular sm:order-5 sm:w-16",
                        stage.dropRate === null
                          ? "text-text-tertiary"
                          : "text-error",
                      )}
                    >
                      {stage.dropRate === null
                        ? "—"
                        : `${Math.abs(stage.dropRate)}%`}
                    </span>
                  </>
                );

                if (!logsHref) {
                  return (
                    <div
                      key={stage.stage}
                      className={cn(
                        "-mx-sm flex flex-wrap items-center gap-x-md gap-y-xs rounded-md px-sm py-xs transition-colors",
                        stage.stage === hoveredStage && "bg-surface-subtle",
                      )}
                      onMouseEnter={() => setHoveredStage(stage.stage)}
                      onMouseLeave={() => setHoveredStage("signup_completed")}
                    >
                      {row}
                    </div>
                  );
                }

                return (
                  <NextLink
                    key={stage.stage}
                    href={logsHref}
                    className={cn(
                      "-mx-sm flex flex-wrap items-center gap-x-md gap-y-xs rounded-md px-sm py-xs transition-colors",
                      stage.stage === hoveredStage && "bg-surface-subtle",
                    )}
                    onMouseEnter={() => setHoveredStage(stage.stage)}
                    onMouseLeave={() => setHoveredStage("signup_completed")}
                  >
                    {row}
                  </NextLink>
                );
              })}
            </div>
          </section>

          <section className="mt-2xl rounded-lg border border-border-default bg-surface p-2xl">
            <div className="flex items-center gap-sm">
              <h2 className="font-sans text-title-18-bold text-text-primary">
                프롬프트 버전별 전환율
              </h2>
              {activeVersion && (
                <Badge variant="accent">{activeVersion.version} 운영중</Badge>
              )}
            </div>

            <div className="mt-lg flex flex-col gap-2xl sm:flex-row">
              <div className="flex shrink-0 flex-col gap-md sm:w-45">
                <p className="font-sans text-caption-12-regular text-text-tertiary">
                  배포 이후 7일 누적 전환율
                </p>

                {previousVersion && conversionImprovement !== undefined && (
                  <p className="font-sans text-caption-12-regular text-text-tertiary">
                    {previousVersion.version} 대비{" "}
                    <strong
                      className={cn(
                        "font-sans text-caption-12-bold",
                        conversionImprovement >= 0
                          ? "text-success"
                          : "text-error",
                      )}
                    >
                      {conversionImprovement >= 0 ? "+" : ""}
                      {conversionImprovement.toFixed(1)}%p
                    </strong>{" "}
                    {conversionImprovement >= 0 ? "개선" : "하락"}
                  </p>
                )}

                <NextLink
                  href="/admin/prompts"
                  className="font-sans text-label-14-bold text-text-secondary underline-offset-2 hover:underline"
                >
                  프롬프트 관리로 이동 →
                </NextLink>
              </div>

              <div className="overflow-x-auto sm:flex-1">
                <div className="flex h-45 w-full min-w-min justify-center gap-lg">
                  {data.promptConversion.map((version) => {
                    const heightPercent =
                      maxConversionRate > 0
                        ? (version.conversionRate / maxConversionRate) * 100
                        : 0;

                    return (
                      <div
                        key={version.version}
                        className="flex w-20 shrink-0 flex-col items-center gap-xs"
                      >
                        <span
                          className={cn(
                            "font-sans text-caption-12-bold",
                            version.isActive
                              ? "text-text-brand"
                              : "text-text-secondary",
                          )}
                        >
                          {version.conversionRate}%
                        </span>
                        <div className="flex w-full flex-1 items-end justify-center">
                          <div
                            className={cn(
                              "w-10 rounded-t-sm transition-all",
                              version.isActive
                                ? "bg-action-primary"
                                : "bg-border-strong",
                            )}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "whitespace-nowrap font-sans text-caption-12-regular",
                            version.isActive
                              ? "text-text-primary"
                              : "text-text-tertiary",
                          )}
                        >
                          <span
                            className={cn(
                              "font-sans",
                              version.isActive
                                ? "text-caption-12-bold"
                                : "text-caption-12-regular",
                            )}
                          >
                            {version.version}
                          </span>{" "}
                          {version.sessionCount.toLocaleString("ko-KR")} 세션
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
