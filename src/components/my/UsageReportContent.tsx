"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Bot, ChevronRight, Database } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { MySubpageHeader } from "@/components/my/MySubpageHeader";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Link } from "@/i18n/navigation";
import { getMyUsageRecommendation, getMyUsageReport } from "@/lib/api/usage";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

const subscribe = () => () => {};

export function UsageReportContent() {
  const t = useTranslations("UsageReport");
  const locale = useLocale();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const accessToken = useAuthStore((state) => state.accessToken);
  const reportQuery = useQuery({
    queryKey: ["my-usage-report"],
    queryFn: getMyUsageReport,
    enabled: hydrated && Boolean(accessToken),
  });
  const recommendationMutation = useMutation({
    mutationFn: getMyUsageRecommendation,
  });

  if (!hydrated || reportQuery.isLoading) return <UsageReportLoading />;

  if (!accessToken || reportQuery.isError || !reportQuery.data) {
    return (
      <div className="min-h-full bg-background pb-3xl">
        <MySubpageHeader title={t("title")} backLabel={t("back")} />
        <main className="px-page py-lg">
          <ErrorState
            title={!accessToken ? t("loginRequired") : t("loadError")}
            description={t("errorDescription")}
            retryLabel={t("retry")}
            onRetry={() => void reportQuery.refetch()}
          />
        </main>
      </div>
    );
  }

  const report = reportQuery.data;
  const numberFormatter = new Intl.NumberFormat(locale);
  const usageRate = Math.min(
    100,
    Math.round((report.dataUsed / report.dataLimit) * 100),
  );
  const remainingData = Math.max(0, report.dataLimit - report.dataUsed);
  const maxHistoryAmount = Math.max(
    ...report.history.map((item) => item.amount),
  );
  const usageDecreased = report.changeRate <= -20;

  return (
    <div className="min-h-full bg-background pb-3xl">
      <MySubpageHeader title={t("title")} backLabel={t("back")} />
      <main className="space-y-lg px-page py-lg">
        <section>
          <div className="flex items-center gap-sm">
            <h1 className="font-sans text-title-20-bold text-text-primary">
              {formatPeriod(report.period, locale)}
            </h1>
            <span className="rounded-full bg-surface-subtle px-sm py-xs font-sans text-micro-11-bold text-text-secondary">
              {t("demoBadge")}
            </span>
          </div>
          <p className="mt-xs font-sans text-caption-13-regular text-text-secondary">
            {t("description")}
          </p>
        </section>

        <ReportCard>
          <div className="flex items-baseline justify-between gap-md">
            <h2 className="font-sans text-label-14-bold text-text-primary">
              {t("monthlyData")}
            </h2>
            <p className="flex shrink-0 items-baseline gap-xs">
              <strong className="font-sans text-title-24-bold text-text-primary">
                {t("gigabytes", { amount: report.dataUsed })}
              </strong>
              <span className="font-sans text-caption-12-regular text-text-secondary">
                / {t("gigabytes", { amount: report.dataLimit })}
              </span>
            </p>
          </div>
          <div className="mt-md h-[8px] overflow-hidden rounded-full bg-border-default">
            <div
              className="h-full rounded-full bg-action-primary"
              style={{ width: `${usageRate}%` }}
            />
          </div>
          <div className="mt-sm flex items-center justify-between gap-md font-sans text-caption-12-regular">
            <span className="text-text-secondary">
              {t("usageRate", { rate: usageRate })}
            </span>
            <strong className="text-success">
              {t("remainingData", { amount: remainingData.toFixed(1) })}
            </strong>
          </div>
        </ReportCard>

        <ReportCard>
          <div className="flex items-center justify-between gap-md">
            <h2 className="font-sans text-label-14-bold text-text-primary">
              {t("recentUsage")}
            </h2>
            <span className="font-sans text-caption-12-regular text-text-secondary">
              {t("averageUsage", { amount: report.recentAverage })}
            </span>
          </div>
          <div className="mt-md flex h-[112px] items-end justify-around gap-xs">
            {report.history.map((item, index) => {
              const isCurrent = index === report.history.length - 1;
              const height = Math.max(
                24,
                Math.round((item.amount / maxHistoryAmount) * 58),
              );
              return (
                <div
                  key={item.month}
                  className="flex min-w-0 flex-1 flex-col items-center gap-sm"
                >
                  <strong
                    className={cn(
                      "font-sans text-micro-11-bold",
                      isCurrent ? "text-text-brand" : "text-text-secondary",
                    )}
                  >
                    {t("gigabytes", { amount: item.amount })}
                  </strong>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "w-[28px] rounded-t-sm",
                      isCurrent ? "bg-action-primary" : "bg-border-strong",
                    )}
                    style={{ height }}
                  />
                  <span
                    className={cn(
                      "font-sans text-caption-12-regular",
                      isCurrent
                        ? "text-caption-12-bold text-text-primary"
                        : "text-text-secondary",
                    )}
                  >
                    {formatMonth(item.month, locale)}
                  </span>
                </div>
              );
            })}
          </div>
        </ReportCard>

        <ReportCard>
          <h2 className="font-sans text-label-14-bold text-text-primary">
            {t("summary")}
          </h2>
          <dl className="mt-sm divide-y divide-border-default">
            <SummaryRow
              label={t("data")}
              value={t("gigabytes", { amount: report.dataUsed })}
            />
            <SummaryRow
              label={t("calls")}
              value={t("minutes", { amount: report.callMinutes })}
            />
            <SummaryRow
              label={t("subscriptions")}
              value={t("subscriptionsCount", {
                count: report.subscriptionCount,
              })}
            />
          </dl>
        </ReportCard>

        <ReportCard className="flex items-center justify-between gap-lg">
          <div>
            <h2 className="font-sans text-label-14-bold text-text-primary">
              {t("estimatedBill")}
            </h2>
            <p className="mt-xs font-sans text-caption-12-regular text-text-secondary">
              {t("basedOnCurrentPlan")}
            </p>
          </div>
          <strong className="shrink-0 font-sans text-title-20-bold text-text-primary">
            {t("won", { amount: numberFormatter.format(report.monthlyFee) })}
          </strong>
        </ReportCard>

        <ReportCard className="bg-surface-subtle">
          <div className="flex items-center gap-sm text-text-brand">
            <Activity aria-hidden="true" size={16} />
            <h2 className="font-sans text-caption-13-bold">
              {t("patternAnalysis")}
            </h2>
          </div>
          <strong className="mt-md block font-sans text-label-14-bold text-text-primary">
            {usageDecreased
              ? t("decreaseTitle", { rate: Math.abs(report.changeRate) })
              : t("stableTitle", { amount: report.recentAverage })}
          </strong>
          <p className="mt-sm font-sans text-caption-12-regular text-text-secondary">
            {usageDecreased
              ? t("decreaseDescription", {
                  previous: report.previousAverage,
                  recent: report.recentAverage,
                })
              : t("stableDescription", { count: report.activeOttCount })}
          </p>
        </ReportCard>

        <section className="space-y-md">
          <button
            type="button"
            disabled={recommendationMutation.isPending}
            onClick={() => recommendationMutation.mutate()}
            className="flex h-[52px] w-full items-center justify-center gap-sm rounded-lg bg-action-primary font-sans text-title-16-bold text-text-on-primary disabled:opacity-60"
          >
            <Bot aria-hidden="true" size={18} />
            {recommendationMutation.isPending
              ? t("analyzingRecommendation")
              : t("analyzeRecommendation")}
          </button>
          {recommendationMutation.isError && (
            <p
              role="alert"
              className="text-center font-sans text-caption-12-regular text-error"
            >
              {t("recommendationError")}
            </p>
          )}
        </section>

        {recommendationMutation.data && (
          <RecommendationCard
            recommendation={recommendationMutation.data}
            locale={locale}
          />
        )}

        <section>
          <div className="flex items-center gap-sm">
            <Database
              aria-hidden="true"
              size={16}
              className="text-text-secondary"
            />
            <h2 className="font-sans text-label-14-bold text-text-primary">
              {t("sourcesTitle")}
            </h2>
          </div>
          <div className="mt-sm flex flex-wrap gap-sm">
            {(["demoUsage", "subscriptions"] as const).map((source) => (
              <span
                key={source}
                className="rounded-full border border-border-default bg-surface px-md py-sm font-sans text-caption-12-regular text-text-secondary"
              >
                {t(`sources.${source}`)}
              </span>
            ))}
          </div>
          <p className="mt-sm font-sans text-caption-12-regular text-text-secondary">
            {t("sourcesDescription")}
          </p>
        </section>

        <section className="space-y-md pt-sm text-center">
          <Link
            href="/my/subscriptions"
            className="flex h-[52px] items-center justify-center rounded-lg bg-action-primary font-sans text-title-16-bold text-text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            {t("manageSubscriptions")}
          </Link>
          {process.env.NODE_ENV !== "production" && (
            <Link
              href="/my/usage/demo"
              className="inline-flex font-sans text-caption-13-medium text-text-secondary"
            >
              {t("demoSettings")}
            </Link>
          )}
        </section>
      </main>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  locale,
}: {
  recommendation: import("@/types/usage").UsageRecommendation;
  locale: string;
}) {
  const t = useTranslations("UsageReport");
  const formatter = new Intl.NumberFormat(locale);
  const recommended = recommendation.recommendedPlan;

  return (
    <section className="rounded-lg border border-action-primary bg-surface p-lg shadow-sm">
      <div className="flex items-center justify-between gap-md">
        <span className="inline-flex items-center gap-xs font-sans text-caption-13-bold text-text-brand">
          <Bot aria-hidden="true" size={16} />
          {recommendation.analysisSource === "ai"
            ? t("aiRecommendation")
            : t("ruleRecommendation")}
        </span>
        {recommendation.monthlySavings > 0 && (
          <span className="rounded-full bg-success-soft px-sm py-xs font-sans text-micro-11-bold text-success">
            {t("monthlySavings", {
              amount: formatter.format(recommendation.monthlySavings),
            })}
          </span>
        )}
      </div>
      <h2 className="mt-md font-sans text-title-16-bold text-text-primary">
        {recommendation.headline}
      </h2>
      <p className="mt-sm font-sans text-caption-13-regular text-text-secondary">
        {recommendation.reason}
      </p>
      {recommended && (
        <>
          <div className="mt-lg grid grid-cols-[1fr_auto_1fr] items-center gap-sm rounded-md bg-surface-subtle p-md">
            <div className="min-w-0">
              <span className="font-sans text-micro-11-regular text-text-tertiary">
                {t("currentPlanLabel")}
              </span>
              <strong className="mt-xs block truncate font-sans text-caption-13-bold text-text-primary">
                {recommendation.currentPlan.name}
              </strong>
              <span className="font-sans text-caption-12-regular text-text-secondary">
                {t("won", {
                  amount: formatter.format(
                    recommendation.currentPlan.monthlyFee,
                  ),
                })}
              </span>
            </div>
            <ChevronRight
              aria-hidden="true"
              size={18}
              className="text-icon-secondary"
            />
            <div className="min-w-0 text-right">
              <span className="font-sans text-micro-11-regular text-text-tertiary">
                {t("recommendedPlanLabel")}
              </span>
              <strong className="mt-xs block truncate font-sans text-caption-13-bold text-text-brand">
                {recommended.name}
              </strong>
              <span className="font-sans text-caption-12-regular text-text-secondary">
                {t("won", { amount: formatter.format(recommended.monthlyFee) })}
              </span>
            </div>
          </div>
          <p className="mt-md text-center font-sans text-caption-12-bold text-success">
            {t("annualSavings", {
              amount: formatter.format(recommendation.monthlySavings * 12),
            })}
          </p>
          <Link
            href={`/plans/${recommended.code}`}
            className="mt-lg flex h-[44px] items-center justify-center rounded-md border border-action-primary font-sans text-label-14-bold text-action-primary"
          >
            {t("viewRecommendedPlan")}
          </Link>
        </>
      )}
    </section>
  );
}

function UsageReportLoading() {
  return (
    <div className="min-h-full bg-background pb-3xl">
      <div className="h-[64px] border-b border-border-default bg-surface" />
      <main className="space-y-lg px-page py-lg" aria-busy="true">
        <div className="h-[48px] animate-pulse rounded-md bg-surface-subtle" />
        <div className="h-[150px] animate-pulse rounded-lg bg-surface" />
        <div className="h-[176px] animate-pulse rounded-lg bg-surface" />
        <div className="h-[180px] animate-pulse rounded-lg bg-surface" />
      </main>
    </div>
  );
}

function ReportCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border-default bg-surface p-lg shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-lg py-sm">
      <dt className="font-sans text-body-14-regular text-text-secondary">
        {label}
      </dt>
      <dd className="font-sans text-label-14-bold text-text-primary">
        {value}
      </dd>
    </div>
  );
}

function formatPeriod(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`));
}

function formatMonth(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`));
}
