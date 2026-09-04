"use client";

import { useEffect } from "react";
import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bell,
  Bot,
  ChartNoAxesColumn,
  ChevronRight,
  ReceiptText,
  Search,
  TicketPercent,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { HomeBannerCarousel } from "@/components/home/HomeBannerCarousel";
import { PageContainer } from "@/components/layout/PageContainer";
import { CurrentPlanSummaryCard } from "@/components/plans/CurrentPlanSummaryCard";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { ApiError } from "@/lib/api/client";
import { getMyCoupons } from "@/lib/api/coupon";
import { getCurrentPlan, getPlanByCode } from "@/lib/api/plan";
import { getMyUsageReport } from "@/lib/api/usage";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

type HomeLinkHref =
  | "/"
  | "/ai"
  | "/benefits"
  | "/my"
  | "/my/benefits"
  | "/my/coupons"
  | "/my/plan"
  | "/my/usage"
  | "/plans";

interface TodoItem {
  href: HomeLinkHref;
  title: string;
  description: string;
  icon: LucideIcon;
}

function getDaysUntilExpiration(expiresAt: string) {
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const expiration = new Date(expiresAt);
  const expirationUtc = Date.UTC(
    expiration.getUTCFullYear(),
    expiration.getUTCMonth(),
    expiration.getUTCDate(),
  );

  return Math.max(
    0,
    Math.ceil((expirationUtc - todayUtc) / (24 * 60 * 60 * 1000)),
  );
}

export function HomeContent() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthHydrated = useAuthHydrated();
  const shouldRedirectToLogin = isAuthHydrated && !accessToken;

  useEffect(() => {
    if (!shouldRedirectToLogin) {
      return;
    }

    router.replace("/login");
  }, [router, shouldRedirectToLogin]);

  const {
    data: currentPlan,
    isPending: isCurrentPlanPending,
    isError: isCurrentPlanError,
    refetch: refetchCurrentPlan,
  } = useQuery({
    queryKey: ["plans", "me", "current"],
    queryFn: getCurrentPlan,
    // 토큰 복원이 끝난 뒤에만 호출해서 비로그인 사용자의 불필요한 401 요청을 피함
    enabled: isAuthHydrated && Boolean(accessToken),
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 401) && failureCount < 1,
  });

  const {
    data: planDetail,
    isPending: isPlanDetailPending,
    isError: isPlanDetailError,
  } = useQuery({
    queryKey: ["plans", currentPlan?.planCode],
    queryFn: () => getPlanByCode(currentPlan!.planCode),
    enabled: Boolean(currentPlan?.planCode),
    retry: 1,
  });

  const couponQuery = useQuery({
    queryKey: ["coupons", "me"],
    queryFn: () => getMyCoupons("all"),
    enabled: Boolean(accessToken && currentPlan),
    retry: false,
  });

  const usageQuery = useQuery({
    queryKey: ["my-usage-report"],
    queryFn: getMyUsageReport,
    enabled: Boolean(accessToken && currentPlan),
    retry: false,
  });

  const numberFormatter = new Intl.NumberFormat(locale);
  const joinedAt = currentPlan?.joinedAt;
  const joinedAtLabel = joinedAt
    ? new Intl.DateTimeFormat(locale, {
        month: "long",
        day: "numeric",
      }).format(new Date(joinedAt))
    : null;

  const hasCurrentPlan = Boolean(currentPlan);
  const isCheckingPlan =
    !isAuthHydrated ||
    shouldRedirectToLogin ||
    (Boolean(accessToken) && isCurrentPlanPending) ||
    (hasCurrentPlan && isPlanDetailPending);

  const selectedBenefitCount = currentPlan
    ? Object.values(currentPlan.selectedOptions).reduce(
        (total, options) => total + options.length,
        0,
      )
    : 0;

  const monthlyFeeLabel = planDetail
    ? t("currentPlanPrice", {
        amount: numberFormatter.format(planDetail.monthlyFee),
      })
    : t("currentPlanPricePending");

  const expiringCoupon = couponQuery.data?.coupons.find(
    (coupon) => coupon.status === "available" && coupon.expiringSoon,
  );
  const expiringCouponDays = expiringCoupon
    ? getDaysUntilExpiration(expiringCoupon.expiresAt)
    : null;

  const todoItems: TodoItem[] = hasCurrentPlan
    ? [
        ...(expiringCoupon
          ? [
              {
                href: "/my/coupons" as const,
                title: t("todoCouponTitle"),
                description:
                  expiringCouponDays === 0
                    ? t("todoCouponExpiresToday", {
                        title: expiringCoupon.title,
                      })
                    : t("todoCouponDescription", {
                        title: expiringCoupon.title,
                        days: expiringCouponDays ?? 0,
                      }),
                icon: Bell,
              },
            ]
          : []),
      ]
    : [
        {
          href: "/plans",
          title: t("noPlanTodoPlanTitle"),
          description: t("noPlanTodoPlanDescription"),
          icon: Search,
        },
        {
          href: "/ai",
          title: t("noPlanTodoAiTitle"),
          description: t("noPlanTodoAiDescription"),
          icon: Bot,
        },
      ];

  const todoCount = t("todoCount", { count: todoItems.length });

  const usageReport = usageQuery.data;
  const usageRate = usageReport?.dataLimit
    ? Math.min(
        100,
        Math.round((usageReport.dataUsed / usageReport.dataLimit) * 100),
      )
    : 0;
  const remainingData = Math.max(
    0,
    (usageReport?.dataLimit ?? 0) - (usageReport?.dataUsed ?? 0),
  );
  const remainingDataLabel = numberFormatter.format(
    Number(remainingData.toFixed(1)),
  );
  const usageDataLabel = usageReport
    ? t("analysisDataAmount", {
        amount: numberFormatter.format(usageReport.dataUsed),
      })
    : t("usageChecking");
  const usageLimitLabel = usageReport
    ? usageReport.dataLimit === null
      ? t("unlimitedData")
      : t("dataSummaryLimit", {
          amount: numberFormatter.format(usageReport.dataLimit),
        })
    : t("usageChecking");

  const analysisAmount = hasCurrentPlan
    ? usageQuery.isPending
      ? t("usageChecking")
      : usageQuery.isError || !usageReport
        ? t("usageCheckRequired")
        : usageReport.changeRate <= -20
          ? t("patternDecreaseAmount", {
              rate: Math.abs(usageReport.changeRate),
            })
          : t("patternAverageAmount", {
              amount: numberFormatter.format(usageReport.recentAverage),
            })
    : t("noPlanBillingAmount");

  const analysisDescription = hasCurrentPlan
    ? usageQuery.isPending
      ? t("usageCheckingDescription")
      : usageQuery.isError || !usageReport
        ? t("usageLoadError")
        : usageReport.changeRate <= -20
          ? t("patternDecreaseDescription")
          : t("patternAverageDescription")
    : t("noPlanBillingDescription");

  const couponCount = hasCurrentPlan
    ? couponQuery.isPending
      ? t("couponChecking")
      : couponQuery.isError
        ? t("couponCheckRequired")
        : t("couponCount", {
            count: couponQuery.data?.summary.available ?? 0,
          })
    : t("noPlanCouponCount");
  const couponDescription = hasCurrentPlan
    ? couponQuery.isPending
      ? t("couponCheckingDescription")
      : couponQuery.isError
        ? t("couponLoadError")
        : t("couponDescription", {
            count: couponQuery.data?.summary.expiring ?? 0,
          })
    : t("noPlanCouponDescription");

  const membershipGrade = hasCurrentPlan
    ? isPlanDetailError
      ? t("membershipGradeUnknown")
      : (planDetail?.membershipTier ?? t("membershipGradeStandard"))
    : t("noPlanMembershipGrade");

  const membershipDescription = hasCurrentPlan
    ? t("membershipDescription")
    : t("noPlanMembershipDescription");

  const membershipAction = hasCurrentPlan
    ? t("membershipAction")
    : t("noPlanMembershipAction");

  return (
    <PageContainer className="flex flex-col gap-xl pb-2xl pt-md">
      <HomeBannerCarousel />

      <div className="flex flex-col gap-lg">
        {isCheckingPlan ? (
          <CurrentPlanLoading />
        ) : isCurrentPlanError ? (
          <CurrentPlanError onRetry={() => refetchCurrentPlan()} />
        ) : currentPlan ? (
          <CurrentPlanSummaryCard
            href="/my/plan"
            planName={planDetail?.name ?? currentPlan.planName}
            monthlyFeeLabel={monthlyFeeLabel}
            dataLabel={
              isPlanDetailError
                ? t("currentPlanDetailError")
                : (planDetail?.data.display ?? t("currentPlanPricePending"))
            }
            voiceLabel={planDetail?.voice ?? t("currentPlanPricePending")}
            selectedBenefitCount={selectedBenefitCount}
            joinedAtLabel={joinedAtLabel}
          />
        ) : (
          <NoPlanCard />
        )}

        {hasCurrentPlan && (
          <section className="rounded-lg border border-border-default bg-surface p-lg shadow-sm">
            <div className="flex items-baseline justify-between gap-lg">
              <h2 className="font-sans text-label-14-bold text-text-primary">
                {t("dataSummaryTitle")}
              </h2>
              <p className="flex shrink-0 items-baseline gap-xs">
                <strong className="font-sans text-title-24-bold text-text-primary">
                  {usageDataLabel}
                </strong>
                <span className="font-sans text-caption-12-regular text-text-secondary">
                  / {usageLimitLabel}
                </span>
              </p>
            </div>

            {usageReport?.dataLimit !== null && (
              <>
                <div className="mt-lg h-[8px] overflow-hidden rounded-full bg-border-default">
                  <div
                    className="h-full rounded-full bg-action-primary"
                    style={{ width: `${usageRate}%` }}
                  />
                </div>

                <div className="mt-sm flex items-center justify-between gap-lg font-sans text-caption-12-regular">
                  <span className="text-text-secondary">
                    {usageReport
                      ? t("dataSummaryUsageRate", { rate: usageRate })
                      : t("usageCheckingDescription")}
                  </span>
                  <strong className="text-success">
                    {usageReport
                      ? t("dataSummaryRemainingData", {
                          amount: remainingDataLabel,
                        })
                      : t("usageChecking")}
                  </strong>
                </div>
              </>
            )}
          </section>
        )}

        <section className="grid grid-cols-2 gap-lg">
          <Link
            href={hasCurrentPlan ? "/my/usage" : "/plans"}
            className="flex min-h-[148px] flex-col rounded-lg border border-border-default bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            <div className="flex items-start justify-between gap-sm">
              <HomeIconTile icon={ChartNoAxesColumn} />
              <ChevronRight
                aria-hidden="true"
                className="shrink-0 text-icon-secondary"
                size={18}
              />
            </div>

            <div className="mt-lg">
              <p className="font-sans text-caption-12-bold text-text-secondary">
                {t("billingTitle")}
              </p>
              <p className="mt-xs font-sans text-title-20-bold text-text-primary">
                {analysisAmount}
              </p>
              <p className="mt-xs font-sans text-micro-11-regular text-text-tertiary">
                {analysisDescription}
              </p>
            </div>
          </Link>

          <Link
            href={hasCurrentPlan ? "/my/coupons" : "/plans"}
            className="flex min-h-[148px] flex-col rounded-lg border border-border-default bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            <div className="flex items-start justify-between gap-sm">
              <HomeIconTile icon={TicketPercent} />
              <ChevronRight
                aria-hidden="true"
                className="shrink-0 text-icon-secondary"
                size={18}
              />
            </div>

            <div className="mt-lg">
              <p className="font-sans text-caption-12-bold text-text-secondary">
                {t("couponTitle")}
              </p>
              <p className="mt-xs font-sans text-title-20-bold text-text-primary">
                {couponCount}
              </p>
              <p className="mt-xs font-sans text-micro-11-regular text-text-tertiary">
                {couponDescription}
              </p>
            </div>
          </Link>
        </section>
      </div>

      {todoItems.length > 0 && (
        <section className="flex flex-col gap-md">
          <div className="flex items-center justify-between gap-md">
            <h2 className="font-sans text-title-16-bold text-text-primary">
              {t("todoTitle")}
            </h2>
            <span className="font-sans text-caption-12-bold text-action-primary">
              {todoCount}
            </span>
          </div>

          <div className="flex flex-col rounded-lg border border-border-default bg-surface shadow-sm">
            {todoItems.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="flex min-h-[72px] items-center gap-md border-b border-border-default px-lg py-md last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-action-primary"
              >
                <HomeIconTile icon={Icon} />

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-sans text-label-14-bold text-text-primary">
                    {title}
                  </span>
                  <span className="mt-xs block truncate font-sans text-caption-12-regular text-text-secondary">
                    {description}
                  </span>
                </span>

                <ChevronRight
                  aria-hidden="true"
                  className="shrink-0 text-icon-secondary"
                  size={18}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-md">
        <h2 className="font-sans text-title-16-bold text-text-primary">
          {t("membershipTitle")}
        </h2>

        <Link
          href={hasCurrentPlan ? "/my/benefits" : "/plans"}
          className="flex items-center justify-between gap-lg rounded-lg border border-border-default bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <div className="flex min-w-0 items-center gap-md">
            <HomeIconTile icon={BadgeCheck} />

            <div className="min-w-0">
              <p className="truncate font-sans text-title-16-bold text-text-primary">
                {membershipGrade}
              </p>
              <p className="mt-xs truncate font-sans text-caption-12-regular text-text-secondary">
                {membershipDescription}
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-brand-soft px-md py-sm font-sans text-caption-12-bold text-text-brand">
            {membershipAction}
          </span>
        </Link>
      </section>
    </PageContainer>
  );
}

function CurrentPlanLoading() {
  const t = useTranslations("Home");

  return (
    <section className="min-h-[210px] rounded-lg border border-border-default bg-surface p-lg shadow-sm">
      <p className="font-sans text-caption-13-bold text-text-secondary">
        {t("currentPlanLoading")}
      </p>
      <div className="mt-md h-[24px] w-2/3 rounded-sm bg-surface-subtle" />
      <div className="mt-sm grid grid-cols-3 gap-sm">
        <div className="h-[56px] rounded-md bg-surface-subtle" />
        <div className="h-[56px] rounded-md bg-surface-subtle" />
        <div className="h-[56px] rounded-md bg-surface-subtle" />
      </div>
    </section>
  );
}

function CurrentPlanError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("Home");

  return (
    <ErrorState
      title={t("currentPlanErrorTitle")}
      description={t("currentPlanErrorDescription")}
      retryLabel={t("currentPlanRetry")}
      onRetry={onRetry}
    />
  );
}

function NoPlanCard() {
  const t = useTranslations("Home");

  return (
    <section className="rounded-lg border border-border-default bg-surface p-lg shadow-sm">
      <div className="flex items-start gap-md">
        <HomeIconTile icon={ReceiptText} />
        <div className="min-w-0">
          <h2 className="font-sans text-title-20-bold leading-snug text-text-primary">
            {t("noPlanTitle")}
          </h2>
          <p className="mt-xs font-sans text-caption-13-regular leading-relaxed text-text-secondary">
            {t("noPlanDescription")}
          </p>
        </div>
      </div>

      <div className="mt-lg grid grid-cols-2 gap-sm">
        <Link
          href="/plans"
          className="flex h-[48px] items-center justify-center rounded-lg bg-action-primary px-md font-sans text-label-14-bold text-text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          {t("noPlanPrimaryAction")}
        </Link>
        <Link
          href="/ai"
          className="flex h-[48px] items-center justify-center rounded-lg border border-border-default bg-surface px-md font-sans text-label-14-bold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          {t("noPlanSecondaryAction")}
        </Link>
      </div>
    </section>
  );
}

function HomeIconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-[36px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
      <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
    </span>
  );
}
