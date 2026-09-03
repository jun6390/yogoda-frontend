"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";

import { PeriodTabs } from "@/components/admin/PeriodTabs";
import { Badge } from "@/components/ui/Badge/Badge";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { getUiElements } from "@/lib/api/admin/ui-elements";
import { ADMIN_UI_ELEMENTS_QUERY_KEYS } from "@/lib/admin/queryKeys";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { AdminPeriod } from "@/types/admin";
import type { UiElement } from "@/types/ui-elements";

function formatChange(value: number) {
  const sign = value >= 0 ? "▲" : "▼";
  return `${sign} ${Math.abs(value).toFixed(1)}%p`;
}

// 관리자가 요소 이름만 보고 실제로 어떤 버튼/카드인지 못 알아볼 수 있어서,
// 호버하면 채팅에서 실제로 보이는 모습을 간단히 재현해서 보여줌 (실 데이터 대신
// 예시 문구를 씀 — 실제 컴포넌트는 next-intl/API 의존이 있어 어드민 트리에서
// 그대로 재사용할 수 없음)
const ELEMENT_PREVIEWS: Partial<Record<UiElement, ReactNode>> = {
  plan_detail: (
    <div className="w-40 shrink-0 overflow-hidden rounded-xl border border-border-default bg-surface shadow-md">
      <div className="flex flex-col gap-xs bg-bubble-user px-md pt-sm pb-md">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-action-primary px-sm py-xs font-sans text-micro-11-bold text-text-on-primary">
            1순위
          </span>
          <span className="font-sans text-micro-11-bold text-action-primary">
            95% 일치
          </span>
        </div>
        <div>
          <p className="font-sans text-label-14-bold text-text-primary">
            너겟 46
          </p>
          <p className="font-sans text-caption-12-bold text-text-primary">
            46,000원 / 월
          </p>
        </div>
      </div>
      <div className="px-md py-sm">
        <p className="font-sans text-micro-11-regular text-text-secondary">
          데이터 46GB · 통화 무제한
        </p>
      </div>
    </div>
  ),
  plan_comparison: (
    <div className="flex items-center gap-xs whitespace-nowrap rounded-lg border border-border-default bg-surface px-md py-sm font-sans text-caption-13-medium text-text-secondary shadow-md">
      내 요금제와 비교 <ChevronRight size={16} />
    </div>
  ),
  explore_plans: (
    <div className="flex items-center gap-xs whitespace-nowrap rounded-lg border border-border-default bg-surface px-md py-sm font-sans text-caption-13-bold text-text-secondary shadow-md">
      다른 요금제 탐색하기 <ChevronRight size={16} />
    </div>
  ),
};

function StatCard({
  title,
  badge,
  ctr,
  ctrChange,
  caption,
  preview,
}: {
  title: string;
  badge?: boolean;
  ctr: number;
  ctrChange: number;
  caption: string;
  preview?: ReactNode;
}) {
  return (
    <div className="flex-1 rounded-lg border border-border-default bg-surface p-3xl">
      <div className="flex items-center justify-between">
        <p className="font-sans text-body-14-regular text-text-secondary">
          {title}
        </p>
        {badge && <Badge variant="error">낮은 클릭률</Badge>}
      </div>
      <p className="mt-md font-sans text-title-24-bold text-text-primary">
        {ctr}%
        <span
          className={cn(
            "ml-xs text-caption-12-bold",
            ctrChange >= 0 ? "text-success" : "text-error",
          )}
        >
          {formatChange(ctrChange)}
        </span>
      </p>

      <div className="mt-lg h-2 w-full overflow-hidden rounded-full bg-border-default">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            badge ? "bg-text-secondary" : "bg-border-strong",
          )}
          style={{ width: `${Math.min(ctr, 100)}%` }}
        />
      </div>

      <p className="mt-md font-sans text-caption-12-regular text-text-tertiary">
        {caption}
      </p>

      {preview && (
        <div className="mt-lg flex justify-center border-t border-border-default pt-lg">
          {preview}
        </div>
      )}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex-1 rounded-lg border border-border-default bg-surface p-3xl">
      <div className="h-4 w-24 animate-pulse rounded-full bg-surface-subtle" />
      <div className="mt-md h-7 w-20 animate-pulse rounded-full bg-surface-subtle" />
      <div className="mt-lg h-2 w-full animate-pulse rounded-full bg-surface-subtle" />
      <div className="mt-md h-3 w-32 animate-pulse rounded-full bg-surface-subtle" />
    </div>
  );
}

function UiAnalysisSkeleton() {
  return (
    <div className="mt-2xl flex flex-col gap-2xl sm:flex-row">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  );
}

export function UiAnalysisContent() {
  const [period, setPeriod] = useState<AdminPeriod>("today");

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ADMIN_UI_ELEMENTS_QUERY_KEYS.summary(period),
    queryFn: () => getUiElements(period),
  });

  // signup_button은 아직 트래킹이 안 붙어서(백엔드 엔드포인트 보류) 프론트에서
  // 안 씀. 응답에 여전히 섞여 내려오는 경우가 있어서 방어적으로 걸러냄.
  // 서버가 CTR 오름차순(낮은 것부터)으로 내려주므로 필터 후에도 그 순서가
  // 유지돼서, 카드도 자연스럽게 저성과 요소가 먼저 보임
  const elements = data?.elements.filter(
    (element) => (element.element as string) !== "signup_button",
  );

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
        <div className="mt-2xl flex flex-col gap-2xl sm:flex-row">
          <StatCard
            title="전체 UI 클릭률"
            ctr={data.overallCtr}
            ctrChange={data.overallCtrChange}
            caption={`총 노출 ${data.totalImpressions.toLocaleString("ko-KR")}건`}
          />

          {elements?.map((element) => (
            <StatCard
              key={element.element}
              title={element.label}
              badge={element.lowCtr}
              ctr={element.ctr}
              ctrChange={element.ctrChange}
              caption={`노출 ${element.impressions.toLocaleString("ko-KR")} · 클릭 ${element.clicks.toLocaleString("ko-KR")}`}
              preview={ELEMENT_PREVIEWS[element.element]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
