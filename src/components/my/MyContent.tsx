"use client";

import { useSyncExternalStore } from "react";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Link } from "@/i18n/navigation";
import { getCurrentPlan, getPlanByCode } from "@/lib/api/plan";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

const subscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

function formatPrice(amount: number, locale: string) {
  return new Intl.NumberFormat(locale).format(amount);
}

interface ManagementRowProps {
  label: string;
  value: string;
  href?: "/benefits" | "/my/account" | "/my/benefits";
  emphasized?: boolean;
}

function ManagementRow({
  label,
  value,
  href,
  emphasized = false,
}: ManagementRowProps) {
  const content = (
    <>
      <span className="font-sans text-label-14-medium text-text-primary">
        {label}
      </span>
      <span
        className={cn(
          "flex min-w-0 items-center gap-xs text-right font-sans text-body-14-regular text-text-secondary",
          emphasized && "text-label-14-bold text-text-brand",
        )}
      >
        <span className="truncate">{value}</span>
        {href && <ChevronRight aria-hidden="true" size={16} />}
      </span>
    </>
  );

  const className =
    "flex min-h-[52px] w-full items-center justify-between gap-lg py-lg text-left";

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function MyContent() {
  const hydrated = useHydrated();
  const t = useTranslations("My");
  const locale = useLocale();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  const isLoggedIn = hydrated && Boolean(accessToken);

  const currentPlanQuery = useQuery({
    queryKey: ["plans", "me", "current"],
    queryFn: getCurrentPlan,
    // persist 토큰 복원 전에 요청하면 보호 API가 401을 반환하므로 hydration 이후 조회함
    enabled: isLoggedIn,
    retry: false,
  });

  const currentPlan = currentPlanQuery.data;
  const planDetailQuery = useQuery({
    queryKey: ["plans", currentPlan?.planCode],
    queryFn: () => getPlanByCode(currentPlan!.planCode),
    enabled: Boolean(currentPlan?.planCode),
    retry: false,
  });

  const displayName = user?.name || t("defaultUserName");
  const planPrice = planDetailQuery.data?.monthlyFee;
  const membershipTier = planDetailQuery.data?.membershipTier
    ? t("membershipTier", { tier: planDetailQuery.data.membershipTier })
    : currentPlan
      ? t("membershipPending")
      : t("membershipUnavailable");
  const selectedBenefitCount = currentPlan
    ? Object.values(currentPlan.selectedOptions).reduce(
        (total, options) => total + options.length,
        0,
      )
    : 0;

  return (
    <div className="min-h-full bg-background pb-lg">
      <section className="px-2xl pb-lg pt-xl">
        <h2 className="font-sans text-title-20-bold text-text-primary">
          {t("greeting", { name: displayName })}
        </h2>
        <p className="mt-xs font-sans text-body-14-regular text-text-secondary">
          {t("benefitNotice", { name: displayName })}
        </p>
      </section>

      <section className="space-y-md px-2xl pb-lg">
        {!hydrated || (currentPlanQuery.isPending && isLoggedIn) ? (
          <div className="h-[128px] animate-pulse rounded-lg border border-border-default bg-surface" />
        ) : currentPlanQuery.isError ? (
          <ErrorState
            title={t("planError")}
            description={t("planErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => currentPlanQuery.refetch()}
          />
        ) : currentPlan ? (
          <Link
            href="/my/plan"
            className="block rounded-lg border border-border-default bg-surface p-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            <div className="flex items-center justify-between gap-md">
              <span className="font-sans text-caption-13-medium text-text-secondary">
                {t("currentPlan")}
              </span>
              <span className="rounded-full bg-brand-soft px-md py-xs font-sans text-caption-12-bold text-text-brand">
                {t("changeRecommendation")}
              </span>
            </div>
            <strong className="mt-md block font-sans text-title-20-bold text-text-primary">
              {currentPlan.planName}
            </strong>
            <span className="mt-xs block font-sans text-caption-13-medium text-text-secondary">
              {typeof planPrice === "number"
                ? t("monthlyPrice", {
                    amount: formatPrice(planPrice, locale),
                  })
                : t("pricePending")}
            </span>
          </Link>
        ) : (
          <Link
            href="/plans"
            className="block rounded-lg border border-border-default bg-surface p-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            <span className="font-sans text-caption-13-medium text-text-secondary">
              {t("currentPlan")}
            </span>
            <strong className="mt-md block font-sans text-title-18-bold text-text-primary">
              {t("noPlan")}
            </strong>
            <span className="mt-xs flex items-center gap-xs font-sans text-caption-13-bold text-text-brand">
              {t("explorePlans")}
              <ChevronRight aria-hidden="true" size={16} />
            </span>
          </Link>
        )}

        <Link
          href="/ai"
          className="flex min-h-[86px] items-center justify-between gap-lg rounded-lg bg-toast-background p-xl text-text-on-primary shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <span className="min-w-0">
            <span className="block font-sans text-caption-13-regular text-text-tertiary">
              {t("savingEyebrow")}
            </span>
            <strong className="mt-xs block font-sans text-title-18-bold">
              <span className="text-text-brand">{t("savingAmount")}</span>{" "}
              {t("savingAvailable")}
            </strong>
          </span>
          <span className="shrink-0 text-right">
            <strong className="block font-sans text-caption-12-bold text-text-brand">
              {t("annualSaving")}
            </strong>
            <span className="mt-xs block font-sans text-micro-11-regular text-text-tertiary">
              {t("viewDiagnosis")}
            </span>
          </span>
        </Link>
      </section>

      {/* 상담 요약 API 연결 전 디자인 검증용 표시 데이터 사용함 */}
      <section className="px-2xl py-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-label-14-bold text-text-primary">
            {t("recentConsultation")}
          </h2>
          <Link
            href="/ai"
            className="font-sans text-caption-13-medium text-text-secondary"
          >
            {t("viewAll")}
          </Link>
        </div>

        <Link
          href="/ai"
          className="mt-md block rounded-lg border border-border-default bg-surface p-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <span className="flex items-start justify-between gap-lg">
            <strong className="truncate font-sans text-label-14-bold text-text-primary">
              {t("consultationTitle")}
            </strong>
            <span className="shrink-0 font-sans text-caption-12-regular text-text-tertiary">
              {t("consultationDate")}
            </span>
          </span>
          <span className="mt-sm flex flex-wrap items-center gap-sm">
            <span className="font-sans text-caption-13-regular text-text-secondary">
              {t("recommendedPlan")}
            </span>
            <strong className="font-sans text-caption-12-bold text-text-brand">
              {t("matchRate")}
            </strong>
          </span>
        </Link>
      </section>

      <section className="px-2xl py-lg">
        <h2 className="font-sans text-label-14-bold text-text-primary">
          {t("benefitManagement")}
        </h2>
        <div className="mt-md divide-y divide-border-default overflow-hidden rounded-lg border border-border-default bg-surface px-lg">
          <ManagementRow
            label={t("myMembership")}
            value={membershipTier}
            href="/my/benefits"
            emphasized
          />
          <ManagementRow label={t("couponWallet")} value={t("comingSoon")} />
          <ManagementRow
            label={t("manageBenefits")}
            value={t("activeBenefitCount", { count: selectedBenefitCount })}
            href="/my/benefits"
          />
          <ManagementRow label={t("stores")} value={t("comingSoon")} />
          <ManagementRow
            label={t("securityAccount")}
            value={t("loginPassword")}
            href="/my/account"
          />
        </div>
      </section>
    </div>
  );
}
