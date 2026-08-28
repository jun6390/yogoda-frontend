"use client";

import { useState } from "react";

import NextLink from "next/link";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/admin/Button";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { getDashboard } from "@/lib/api/admin/dashboard";
import { ADMIN_DASHBOARD_QUERY_KEYS } from "@/lib/admin/queryKeys";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { DashboardPeriod } from "@/types/dashboard";

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "today", label: "오늘" },
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
];

function formatChange(value: number) {
  const sign = value >= 0 ? "▲" : "▼";
  return `${sign} ${Math.abs(value).toFixed(1)}%p`;
}

// kpi.*Prev는 "해당 기간 바로 이전의 동일 기간"과 비교한 값이라, 기간 선택에 맞춰 라벨도 바꿔줌
function getPrevPeriodLabel(period: DashboardPeriod) {
  if (period === "today") return "전일";
  if (period === "7d") return "전주";
  return "전월";
}

function KpiCard({
  title,
  value,
  unit,
  change,
  prev,
  prevLabel,
}: {
  title: string;
  value: number;
  unit: string;
  change: number;
  prev: number;
  prevLabel: string;
}) {
  return (
    <div className="flex-1 rounded-lg border border-border-default bg-surface p-lg">
      <div className="flex items-center justify-between">
        <p className="font-sans text-body-14-regular text-text-secondary">
          {title}
        </p>
        <span
          className={cn(
            "font-sans text-caption-12-bold",
            change >= 0 ? "text-success" : "text-error",
          )}
        >
          {formatChange(change)}
        </span>
      </div>
      <p className="mt-sm font-sans text-title-24-bold text-text-primary">
        {value.toLocaleString("ko-KR")}
        <span className="ml-xs text-title-18-bold text-text-secondary">
          {unit}
        </span>
      </p>
      <p className="mt-xs font-sans text-caption-12-regular text-text-tertiary">
        {prevLabel} {prev.toLocaleString("ko-KR")}
        {unit}
      </p>
    </div>
  );
}

export function DashboardContent() {
  const [period, setPeriod] = useState<DashboardPeriod>("today");

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ADMIN_DASHBOARD_QUERY_KEYS.summary(period),
    queryFn: () => getDashboard(period),
  });

  // 배너를 닫으면 그 이탈 단계에 한해서만 숨기고, 데이터가 바뀌어 최다 이탈 단계가
  // 달라지면(기간 변경 등) 다시 보여줌
  const [dismissedStage, setDismissedStage] = useState<string | null>(null);

  const maxDropStageLabel = data?.funnel.stages.find(
    (stage) => stage.stage === data.funnel.maxDropStage,
  )?.label;

  const showDropStageAlert =
    Boolean(maxDropStageLabel) && data?.funnel.maxDropStage !== dismissedStage;

  const maxStageCount = data
    ? Math.max(...data.funnel.stages.map((stage) => stage.count))
    : 0;

  const maxConversionRate = data
    ? Math.max(...data.promptConversion.map((v) => v.conversionRate))
    : 0;

  return (
    <div className="p-2xl">
      <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-title-24-bold text-text-primary">
            대시보드
          </h1>
          <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
            추천에서 가입까지의 전환 흐름을 한눈에 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-3 gap-xs rounded-lg bg-surface-subtle p-xs sm:inline-grid">
          {PERIOD_OPTIONS.map((option) => {
            const isSelected = period === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={cn(
                  "h-[36px] rounded-sm px-lg font-sans text-label-14-bold transition-colors",
                  isSelected
                    ? "bg-surface text-text-brand shadow-sm"
                    : "text-text-secondary",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {isPending && (
        <p className="mt-xl font-sans text-body-14-regular text-text-secondary">
          불러오는 중이에요...
        </p>
      )}

      {isError && (
        <ErrorState
          className="mt-xl"
          title="대시보드를 불러오지 못했어요"
          description={error instanceof ApiError ? error.message : undefined}
          retryLabel="다시 시도"
          onRetry={() => refetch()}
        />
      )}

      {data && (
        <>
          {showDropStageAlert && (
            <div className="mt-xl flex flex-wrap items-center gap-md rounded-lg border border-error-soft bg-error-soft px-lg py-md">
              <AlertTriangle
                aria-hidden="true"
                size={20}
                className="shrink-0 text-error"
              />
              <p className="flex-1 font-sans text-body-14-regular text-text-primary">
                <strong className="font-sans text-label-14-bold text-error">
                  {maxDropStageLabel}
                </strong>{" "}
                단계 이탈률이 가장 높아요. 전체 이탈률은{" "}
                {data.funnel.totalDropRate}%예요.
              </p>

              <NextLink
                href={`/admin/logs?drop_stage=${data.funnel.maxDropStage}`}
                className="shrink-0 font-sans text-label-14-bold text-text-primary underline underline-offset-2"
              >
                해당 로그 보기
              </NextLink>

              <NextLink href="/admin/prompts" className="shrink-0">
                <Button variant="primary" className="h-[36px] px-lg py-0">
                  프롬프트 개선하기
                </Button>
              </NextLink>

              <button
                type="button"
                aria-label="배너 닫기"
                onClick={() => setDismissedStage(data.funnel.maxDropStage)}
                className="flex size-touch shrink-0 items-center justify-center text-text-secondary"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
          )}

          <div className="mt-xl flex flex-col gap-lg sm:flex-row">
            <KpiCard
              title="추천 건수"
              value={data.kpi.consultationCount}
              unit="건"
              change={data.kpi.consultationChange}
              prev={data.kpi.consultationPrev}
              prevLabel={getPrevPeriodLabel(period)}
            />
            <KpiCard
              title="가입 건수"
              value={data.kpi.signupCount}
              unit="건"
              change={data.kpi.signupChange}
              prev={data.kpi.signupPrev}
              prevLabel={getPrevPeriodLabel(period)}
            />
            <KpiCard
              title="전환율"
              value={data.kpi.conversionRate}
              unit="%"
              change={data.kpi.conversionRateChange}
              prev={data.kpi.conversionRatePrev}
              prevLabel={getPrevPeriodLabel(period)}
            />
          </div>

          <section className="mt-xl rounded-lg border border-border-default bg-surface p-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-title-18-bold text-text-primary">
                추천 → 가입 퍼널
              </h2>
              <span className="font-sans text-caption-12-regular text-text-tertiary">
                전체 이탈률 {data.funnel.totalDropRate}%
              </span>
            </div>

            <div className="mt-lg flex flex-col gap-md">
              {data.funnel.stages.map((stage) => {
                const widthPercent =
                  maxStageCount > 0 ? (stage.count / maxStageCount) * 100 : 0;
                const isMaxDrop = stage.stage === data.funnel.maxDropStage;

                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-label-14-bold text-text-primary">
                        {stage.label}
                        {isMaxDrop && (
                          <span className="ml-xs rounded-full bg-error-soft px-sm py-xs font-sans text-micro-11-bold text-error">
                            최다 이탈
                          </span>
                        )}
                      </span>
                      <span className="font-sans text-caption-12-regular text-text-tertiary">
                        {stage.count.toLocaleString("ko-KR")}건 · 진입{" "}
                        {stage.entryRate}%
                        {stage.dropRate !== null && (
                          <span className="ml-xs text-error">
                            {stage.dropRate}%
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-xs h-[24px] w-full overflow-hidden rounded-sm bg-surface-subtle">
                      <div
                        className={cn(
                          "h-full rounded-sm transition-all",
                          isMaxDrop ? "bg-error" : "bg-action-primary",
                        )}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-xl rounded-lg border border-border-default bg-surface p-lg">
            <h2 className="font-sans text-title-18-bold text-text-primary">
              프롬프트 버전별 전환율
            </h2>

            <div className="mt-lg flex h-[180px] items-end gap-lg">
              {data.promptConversion.map((version) => {
                const heightPercent =
                  maxConversionRate > 0
                    ? (version.conversionRate / maxConversionRate) * 100
                    : 0;

                return (
                  <div
                    key={version.version}
                    className="flex flex-1 flex-col items-center gap-xs"
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
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className={cn(
                          "w-full rounded-t-sm transition-all",
                          version.isActive
                            ? "bg-action-primary"
                            : "bg-border-strong",
                        )}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="font-sans text-caption-12-regular text-text-tertiary">
                      {version.version}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
