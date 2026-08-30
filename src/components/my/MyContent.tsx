"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { CurrentPlanSummaryCard } from "@/components/plans/CurrentPlanSummaryCard";
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
  href?:
    | "/benefits"
    | "/my/account"
    | "/my/benefits"
    | "/my/coupons"
    | "/my/points"
    | "/my/stores";
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
        {href && <ChevronRight aria-hidden="true" size={18} />}
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
  const planPrice = planDetailQuery.data?.monthlyFee ?? currentPlan?.monthlyFee;
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
  const joinedAtLabel = currentPlan?.joinedAt
    ? new Intl.DateTimeFormat(locale, {
        month: "long",
        day: "numeric",
      }).format(new Date(currentPlan.joinedAt))
    : null;

  return (
    <div className="min-h-full bg-background">
      <main className="flex flex-col gap-xl px-page pb-lg pt-xl">
        <section>
          <h2 className="font-sans text-title-20-bold text-text-primary">
            {t("greeting", { name: displayName })}
          </h2>
          <p className="mt-xs font-sans text-body-14-regular text-text-secondary">
            {t("benefitNotice", { name: displayName })}
          </p>
        </section>

        <section className="flex flex-col gap-lg">
          {!hydrated || (currentPlanQuery.isPending && isLoggedIn) ? (
            <div className="h-[226px] animate-pulse rounded-lg border border-border-default bg-surface shadow-sm" />
          ) : currentPlanQuery.isError ? (
            <ErrorState
              title={t("planError")}
              description={t("planErrorDescription")}
              retryLabel={t("retry")}
              onRetry={() => currentPlanQuery.refetch()}
            />
          ) : currentPlan ? (
            <CurrentPlanSummaryCard
              href="/my/plan"
              planName={planDetailQuery.data?.name ?? currentPlan.planName}
              monthlyFeeLabel={
                typeof planPrice === "number"
                  ? t("monthlyPrice", {
                      amount: formatPrice(planPrice, locale),
                    })
                  : t("pricePending")
              }
              dataLabel={
                planDetailQuery.data?.data.display ?? t("detailPending")
              }
              voiceLabel={planDetailQuery.data?.voice ?? t("detailPending")}
              selectedBenefitCount={selectedBenefitCount}
              joinedAtLabel={joinedAtLabel}
            />
          ) : (
            <Link
              href="/plans"
              className="block rounded-lg border border-border-default bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            >
              <span className="font-sans text-caption-13-medium text-text-secondary">
                {t("currentPlan")}
              </span>
              <strong className="mt-md block font-sans text-title-18-bold text-text-primary">
                {t("noPlan")}
              </strong>
              <span className="mt-xs flex items-center gap-xs font-sans text-caption-13-bold text-text-brand">
                {t("explorePlans")}
                <ChevronRight aria-hidden="true" size={18} />
              </span>
            </Link>
          )}

          <Link
            href="/ai"
            className="relative block min-h-[156px] overflow-hidden rounded-lg border border-border-default bg-[#fcdee2] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            <Image
              src="/yogoda-banners/savings-character-scene-v3.webp"
              alt=""
              width={382}
              height={540}
              loading="eager"
              fetchPriority="high"
              sizes="106px"
              className="pointer-events-none absolute bottom-[-4px] right-lg h-[150px] w-auto"
            />
            <span className="relative z-[1] flex min-h-[156px] w-[68%] flex-col justify-center px-lg py-lg text-[#17171c]">
              <span className="block font-sans text-caption-13-regular text-[#6f6f79]">
                {t("savingEyebrow")}
              </span>
              <strong className="mt-xs block font-sans text-title-18-bold">
                <span className="text-[#e01485]">{t("savingAmount")}</span>{" "}
                {t("savingAvailable")}
              </strong>
              <span className="mt-md flex flex-wrap items-center gap-sm">
                <strong className="whitespace-nowrap rounded-full bg-[#ffffff] px-sm py-xs font-sans text-caption-12-bold text-[#e01485] shadow-sm">
                  {t("annualSaving")}
                </strong>
                <span className="whitespace-nowrap font-sans text-caption-12-bold text-[#4b5563]">
                  {t("viewDiagnosis")}
                </span>
              </span>
            </span>
          </Link>
        </section>

        <section className="flex flex-col gap-md">
          <h2 className="font-sans text-label-14-bold text-text-primary">
            {t("benefitManagement")}
          </h2>
          <div className="divide-y divide-border-default overflow-hidden rounded-lg border border-border-default bg-surface px-lg shadow-sm">
            <ManagementRow
              label={t("myMembership")}
              value={membershipTier}
              href="/my/benefits"
              emphasized
            />
            <ManagementRow
              label={t("pointShop")}
              value={t("usePoints")}
              href="/my/points"
            />
            <ManagementRow
              label={t("couponWallet")}
              value={t("viewCoupons")}
              href="/my/coupons"
            />
            <ManagementRow
              label={t("manageBenefits")}
              value={t("activeBenefitCount", { count: selectedBenefitCount })}
              href="/my/benefits"
            />
            <ManagementRow
              label={t("stores")}
              value={t("findStores")}
              href="/my/stores"
            />
            <ManagementRow
              label={t("securityAccount")}
              value={t("loginPassword")}
              href="/my/account"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
