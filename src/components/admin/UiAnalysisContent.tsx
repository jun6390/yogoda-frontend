"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { PeriodTabs } from "@/components/admin/PeriodTabs";
import { Badge } from "@/components/ui/Badge/Badge";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { getUiElements } from "@/lib/api/admin/ui-elements";
import { ADMIN_UI_ELEMENTS_QUERY_KEYS } from "@/lib/admin/queryKeys";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { AdminPeriod } from "@/types/admin";

function formatChange(value: number) {
  const sign = value >= 0 ? "▲" : "▼";
  return `${sign} ${Math.abs(value).toFixed(1)}%p`;
}

function StatCardSkeleton() {
  return (
    <div className="flex-1 rounded-lg border border-border-default bg-surface p-2xl">
      <div className="h-4 w-24 animate-pulse rounded-full bg-surface-subtle" />
      <div className="mt-sm h-7 w-20 animate-pulse rounded-full bg-surface-subtle" />
      <div className="mt-xs h-3 w-32 animate-pulse rounded-full bg-surface-subtle" />
    </div>
  );
}

function UiAnalysisSkeleton() {
  return (
    <>
      <div className="mt-2xl flex flex-col gap-2xl sm:flex-row">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <section className="mt-2xl rounded-lg border border-border-default bg-surface p-2xl">
        <div className="h-5 w-32 animate-pulse rounded-full bg-surface-subtle" />

        <div className="mt-lg overflow-x-auto">
          <table className="w-full min-w-140 border-collapse text-left">
            <tbody>
              {Array.from({ length: 4 }).map((_, index) => (
                <tr key={index} className="border-b border-border-default">
                  <td className="px-sm py-md">
                    <div className="h-4 w-28 animate-pulse rounded-full bg-surface-subtle" />
                  </td>
                  <td className="px-sm py-md">
                    <div className="ml-auto h-4 w-14 animate-pulse rounded-full bg-surface-subtle" />
                  </td>
                  <td className="px-sm py-md">
                    <div className="ml-auto h-4 w-14 animate-pulse rounded-full bg-surface-subtle" />
                  </td>
                  <td className="w-45 px-sm py-md">
                    <div className="ml-auto h-4 w-16 animate-pulse rounded-full bg-surface-subtle" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function UiAnalysisContent() {
  const [period, setPeriod] = useState<AdminPeriod>("today");

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ADMIN_UI_ELEMENTS_QUERY_KEYS.summary(period),
    queryFn: () => getUiElements(period),
  });

  // 서버가 CTR 오름차순으로 정렬해서 내려주므로, 첫 번째가 가장 저성과 요소임
  const lowestCtrElement = data?.elements[0];

  return (
    <div className="p-3xl">
      <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-title-24-bold text-text-primary">
            UI 행동 분석
          </h1>
          <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
            추천 카드 내 UI 요소의 노출·클릭을 비교해 이탈 원인을 좁히세요
          </p>
        </div>

        <PeriodTabs value={period} onChange={setPeriod} />
      </div>

      {isPending && <UiAnalysisSkeleton />}

      {isError && (
        <ErrorState
          className="mt-2xl"
          title="UI 행동 분석 데이터를 불러오지 못했어요"
          description={error instanceof ApiError ? error.message : undefined}
          retryLabel="다시 시도"
          onRetry={() => refetch()}
        />
      )}

      {data && (
        <>
          <div className="mt-2xl flex flex-col gap-2xl sm:flex-row">
            <div className="flex-1 rounded-lg border border-border-default bg-surface p-2xl">
              {lowestCtrElement ? (
                <>
                  <Badge variant="error">낮은 클릭률</Badge>
                  <p className="mt-sm font-sans text-title-18-bold text-text-primary">
                    {lowestCtrElement.label}
                  </p>
                  <p className="mt-xs font-sans text-caption-12-regular text-text-tertiary">
                    노출 {lowestCtrElement.impressions.toLocaleString("ko-KR")}{" "}
                    · 클릭 {lowestCtrElement.clicks.toLocaleString("ko-KR")}
                  </p>
                  <p className="mt-sm font-sans text-title-24-bold text-error">
                    {lowestCtrElement.ctr}%
                    <span className="ml-xs font-sans text-caption-12-bold text-text-tertiary">
                      {formatChange(lowestCtrElement.ctrChange)}
                    </span>
                  </p>
                </>
              ) : (
                <p className="font-sans text-body-14-regular text-text-secondary">
                  아직 데이터가 없어요.
                </p>
              )}
            </div>

            <div className="flex-1 rounded-lg border border-border-default bg-surface p-2xl">
              <p className="font-sans text-body-14-regular text-text-secondary">
                전체 UI 클릭률
              </p>
              <p className="mt-sm font-sans text-title-24-bold text-text-primary">
                {data.overallCtr}%
                <span
                  className={cn(
                    "ml-xs text-caption-12-bold",
                    data.overallCtrChange >= 0 ? "text-success" : "text-error",
                  )}
                >
                  {formatChange(data.overallCtrChange)}
                </span>
              </p>
              <p className="mt-xs font-sans text-caption-12-regular text-text-tertiary">
                총 노출 {data.totalImpressions.toLocaleString("ko-KR")}건
              </p>
            </div>
          </div>

          <section className="mt-2xl rounded-lg border border-border-default bg-surface p-2xl">
            <div className="flex flex-wrap items-center justify-between gap-xs">
              <h2 className="font-sans text-title-18-bold text-text-primary">
                UI 요소별 성과
              </h2>
              <span className="font-sans text-caption-12-regular text-text-tertiary">
                CTR 30% 미만은 강조 표시
              </span>
            </div>

            <div className="mt-lg overflow-x-auto">
              <table className="w-full min-w-140 border-collapse text-left">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="px-sm py-sm font-sans text-caption-12-bold text-text-tertiary">
                      UI 요소
                    </th>
                    <th className="px-sm py-sm text-right font-sans text-caption-12-bold text-text-tertiary">
                      노출 수
                    </th>
                    <th className="px-sm py-sm text-right font-sans text-caption-12-bold text-text-tertiary">
                      클릭 수
                    </th>
                    <th className="w-45 px-sm py-sm text-right font-sans text-caption-12-bold text-text-tertiary">
                      CTR
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.elements.map((element) => (
                    <tr
                      key={element.element}
                      className={cn(
                        "border-b border-border-default last:border-b-0",
                        element.lowCtr && "bg-error-soft",
                      )}
                    >
                      <td className="px-sm py-md font-sans text-label-14-bold text-text-primary">
                        <span className="flex items-center gap-xs">
                          {element.label}
                          {element.lowCtr && (
                            <Badge variant="error">낮은 클릭률</Badge>
                          )}
                        </span>
                      </td>
                      <td className="px-sm py-md text-right font-sans text-body-14-regular text-text-primary">
                        {element.impressions.toLocaleString("ko-KR")}
                      </td>
                      <td className="px-sm py-md text-right font-sans text-body-14-regular text-text-primary">
                        {element.clicks.toLocaleString("ko-KR")}
                      </td>
                      <td className="px-sm py-md">
                        <div className="flex items-center justify-end gap-xs">
                          <span className="font-sans text-label-14-bold text-text-primary">
                            {element.ctr}%
                          </span>
                          <span
                            className={cn(
                              "font-sans text-caption-12-regular",
                              element.ctrChange >= 0
                                ? "text-success"
                                : "text-error",
                            )}
                          >
                            {formatChange(element.ctrChange)}
                          </span>
                        </div>
                        <div className="mt-xs h-1.5 w-full overflow-hidden rounded-sm bg-surface-subtle">
                          <div
                            className={cn(
                              "h-full rounded-sm transition-all",
                              element.lowCtr ? "bg-error" : "bg-border-strong",
                            )}
                            style={{ width: `${Math.min(element.ctr, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
