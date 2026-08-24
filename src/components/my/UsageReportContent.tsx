"use client";

import type { ReactNode } from "react";

import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { MySubpageHeader } from "@/components/my/MySubpageHeader";
import { usageReport } from "@/data/usageReport";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function UsageReportContent() {
  const t = useTranslations("UsageReport");
  const locale = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale);
  const usageRate = Math.min(
    100,
    Math.round((usageReport.dataUsed / usageReport.dataLimit) * 100),
  );
  const remainingData = Math.max(
    0,
    usageReport.dataLimit - usageReport.dataUsed,
  );
  const maxHistoryAmount = Math.max(
    ...usageReport.history.map((item) => item.amount),
  );

  return (
    <div className="min-h-full bg-background pb-3xl">
      <MySubpageHeader title={t("title")} backLabel={t("back")} />

      <main className="space-y-lg px-page py-lg">
        <section>
          <h1 className="font-sans text-title-20-bold text-text-primary">
            {formatPeriod(usageReport.period, locale)}
          </h1>
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
                {t("gigabytes", { amount: usageReport.dataUsed })}
              </strong>
              <span className="font-sans text-caption-12-regular text-text-secondary">
                / {t("gigabytes", { amount: usageReport.dataLimit })}
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
              {t("averageUsage", { amount: usageReport.insightAverage })}
            </span>
          </div>
          <div className="mt-md flex h-[112px] items-end justify-between">
            {usageReport.history.map((item, index) => {
              const isCurrent = index === usageReport.history.length - 1;
              const height = Math.max(
                32,
                Math.round((item.amount / maxHistoryAmount) * 58),
              );

              return (
                <div
                  key={item.month}
                  className="flex w-[80px] flex-col items-center gap-sm"
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
                      "w-[32px] rounded-t-sm",
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
              value={t("gigabytes", { amount: usageReport.dataUsed })}
            />
            <SummaryRow
              label={t("calls")}
              value={t("minutes", { amount: usageReport.callMinutes })}
            />
            <SummaryRow
              label={t("subscriptions")}
              value={t("subscriptionsCount", {
                count: usageReport.subscriptionCount,
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
            {t("won", {
              amount: numberFormatter.format(usageReport.monthlyFee),
            })}
          </strong>
        </ReportCard>

        <section className="rounded-lg bg-toast-background p-lg text-text-on-primary">
          <div className="flex items-center gap-sm text-text-brand">
            <Sparkles aria-hidden="true" size={16} />
            <h2 className="font-sans text-caption-13-bold">
              {t("aiAnalysis")}
            </h2>
          </div>
          <strong className="mt-md block font-sans text-label-14-bold">
            {t("insightTitle", { amount: usageReport.insightAverage })}
          </strong>
          <p className="mt-sm font-sans text-caption-12-regular text-text-tertiary">
            {t("insightDescription")}
          </p>
          <span className="mt-md inline-flex rounded-sm bg-success/15 px-sm py-xs font-sans text-micro-11-bold text-success">
            {t("potentialSavings", {
              amount: numberFormatter.format(usageReport.potentialSavings),
            })}
          </span>
        </section>

        <section>
          <h2 className="font-sans text-label-14-bold text-text-primary">
            {t("sourcesTitle")}
          </h2>
          <div className="mt-sm flex flex-wrap gap-sm">
            {usageReport.insightSources.map((source) => (
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
            href="/plans"
            className="flex h-[52px] items-center justify-center rounded-lg bg-action-primary font-sans text-title-16-bold text-text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            {t("viewRecommendations")}
          </Link>
          <Link
            href="/ai"
            className="inline-flex font-sans text-caption-13-medium text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            {t("askAi")}
          </Link>
        </section>
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
        "rounded-lg border border-border-default bg-surface p-lg",
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
