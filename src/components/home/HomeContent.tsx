"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Barcode,
  Bell,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Gift,
  ReceiptText,
  Search,
  Sparkles,
  TicketPercent,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { HomeBannerCarousel } from "@/components/home/HomeBannerCarousel";
import { PageContainer } from "@/components/layout/PageContainer";
import { ApiError } from "@/lib/api/client";
import { getCurrentPlan, getPlanByCode } from "@/lib/api/plan";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

type HomeLinkHref = "/" | "/ai" | "/benefits" | "/my" | "/plans";

interface TodoItem {
  href: HomeLinkHref;
  title: string;
  description: string;
  icon: typeof CalendarDays;
}

interface PlanStatProps {
  label: string;
  value: string;
}

function subscribeToAuthHydration(onStoreChange: () => void) {
  const unsubscribeHydrate = useAuthStore.persist.onHydrate(onStoreChange);
  const unsubscribeFinishHydration =
    useAuthStore.persist.onFinishHydration(onStoreChange);

  return () => {
    unsubscribeHydrate();
    unsubscribeFinishHydration();
  };
}

function useAuthHydrated() {
  /*
   * zustand persist hydration 상태는 React state가 아니므로
   * useSyncExternalStore로 구독해서 토큰 복원 전 로그인 페이지로 튀는 문제를 막음
   */
  return useSyncExternalStore(
    subscribeToAuthHydration,
    () => useAuthStore.persist.hasHydrated(),
    () => false,
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

  const quickActions = [
    {
      href: "/my",
      label: t("quickPlan"),
      icon: ReceiptText,
    },
    {
      href: "/benefits",
      label: t("quickBenefit"),
      icon: Gift,
    },
    {
      href: "/my",
      label: t("quickAnalysis"),
      icon: BarChart3,
    },
    {
      href: "/ai",
      label: t("quickConsulting"),
      icon: Sparkles,
    },
  ] as const;

  const todoItems: TodoItem[] = hasCurrentPlan
    ? [
        {
          href: "/my",
          title: t("todoContractTitle"),
          description: t("todoContractDescription"),
          icon: CalendarDays,
        },
        {
          href: "/benefits",
          title: t("todoCouponTitle"),
          description: t("todoCouponDescription"),
          icon: Bell,
        },
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
          icon: Sparkles,
        },
      ];

  const todoCount = hasCurrentPlan ? t("todoCount") : t("noPlanTodoCount");

  const billingAmount = planDetail
    ? t("billingAmountDynamic", {
        amount: numberFormatter.format(planDetail.monthlyFee),
      })
    : hasCurrentPlan
      ? t("currentPlanPricePending")
      : t("noPlanBillingAmount");

  const billingDescription = hasCurrentPlan
    ? t("billingDueDate")
    : t("noPlanBillingDescription");

  const couponCount = hasCurrentPlan
    ? t("couponCount")
    : t("noPlanCouponCount");
  const couponDescription = hasCurrentPlan
    ? t("couponDescription")
    : t("noPlanCouponDescription");

  const membershipGrade = hasCurrentPlan
    ? (planDetail?.membershipTier ?? t("membershipGrade"))
    : t("noPlanMembershipGrade");

  const membershipDescription = hasCurrentPlan
    ? t("membershipDescription")
    : t("noPlanMembershipDescription");

  const membershipAction = hasCurrentPlan
    ? t("membershipAction")
    : t("noPlanMembershipAction");

  return (
    <PageContainer className="flex flex-col gap-2xl pb-2xl pt-md">
      <HomeBannerCarousel />

      {isCheckingPlan ? (
        <CurrentPlanLoading />
      ) : isCurrentPlanError ? (
        <CurrentPlanError onRetry={() => refetchCurrentPlan()} />
      ) : currentPlan ? (
        <CurrentPlanCard
          planCode={currentPlan.planCode}
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

      <section className="grid grid-cols-2 gap-sm">
        <Link
          href={hasCurrentPlan ? "/my" : "/plans"}
          className="flex min-h-[132px] flex-col justify-between rounded-lg bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <div className="flex items-start justify-between gap-sm">
            <span className="flex size-[32px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
              <CreditCard size={20} strokeWidth={1.8} />
            </span>
            <ChevronRight
              aria-hidden="true"
              className="shrink-0 text-icon-secondary"
              size={18}
            />
          </div>

          <div>
            <p className="font-sans text-caption-12-bold text-text-secondary">
              {t("billingTitle")}
            </p>
            <p className="mt-xs font-sans text-title-20-bold text-text-primary">
              {billingAmount}
            </p>
            <p className="mt-xs font-sans text-micro-11-regular text-text-tertiary">
              {billingDescription}
            </p>
          </div>
        </Link>

        <Link
          href={hasCurrentPlan ? "/benefits" : "/plans"}
          className="flex min-h-[132px] flex-col justify-between rounded-lg bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <div className="flex items-start justify-between gap-sm">
            <span className="flex size-[32px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
              <TicketPercent size={20} strokeWidth={1.8} />
            </span>
            <ChevronRight
              aria-hidden="true"
              className="shrink-0 text-icon-secondary"
              size={18}
            />
          </div>

          <div>
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

      <section className="flex flex-col gap-md">
        <div className="flex items-center justify-between gap-md">
          <h2 className="font-sans text-title-16-bold text-text-primary">
            {t("todoTitle")}
          </h2>
          <span className="font-sans text-caption-12-bold text-action-primary">
            {todoCount}
          </span>
        </div>

        <div className="flex flex-col rounded-lg bg-surface shadow-sm">
          {todoItems.map(({ href, title, description, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="flex min-h-[72px] items-center gap-md border-b border-border-default px-lg py-md last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-action-primary"
            >
              <span className="flex size-[36px] shrink-0 items-center justify-center rounded-sm bg-surface-subtle text-icon-brand">
                <Icon size={20} strokeWidth={1.8} />
              </span>

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

      <section className="flex flex-col gap-md">
        <div className="flex items-center justify-between gap-md">
          <h2 className="font-sans text-title-16-bold text-text-primary">
            {t("quickTitle")}
          </h2>
          <Link
            href="/my"
            className="font-sans text-caption-12-medium text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            {t("viewAll")} ›
          </Link>
        </div>

        <div className="grid grid-cols-4 justify-between gap-sm">
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex h-[72px] flex-col items-center justify-center gap-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            >
              <span className="flex size-[32px] items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
                <Icon size={24} strokeWidth={1.8} />
              </span>
              <span className="whitespace-nowrap font-sans text-caption-12-bold text-text-primary">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-md">
        <div className="flex items-center justify-between gap-md">
          <h2 className="font-sans text-title-16-bold text-text-primary">
            {t("membershipTitle")}
          </h2>
          <Link
            href={hasCurrentPlan ? "/benefits" : "/plans"}
            className="font-sans text-caption-12-medium text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            {t("viewAll")} ›
          </Link>
        </div>

        <Link
          href={hasCurrentPlan ? "/benefits" : "/plans"}
          className="flex items-center justify-between gap-lg rounded-lg bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <div className="flex min-w-0 items-center gap-md">
            <span className="flex size-[44px] shrink-0 items-center justify-center rounded-lg bg-brand-soft text-icon-brand">
              <Barcode size={26} strokeWidth={1.7} />
            </span>

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

      <Link
        href={hasCurrentPlan ? "/benefits" : "/plans"}
        className="flex items-center justify-between gap-lg py-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      >
        <div className="min-w-0">
          <h2 className="truncate font-sans text-title-16-bold text-text-primary">
            {hasCurrentPlan
              ? t("personalBenefitTitle")
              : t("noPlanPersonalBenefitTitle")}
          </h2>
          <p className="mt-xs truncate font-sans text-body-14-regular text-text-secondary">
            {hasCurrentPlan
              ? t("personalBenefitDescription")
              : t("noPlanPersonalBenefitDescription")}
          </p>
        </div>

        <span className="shrink-0 font-sans text-label-14-bold text-action-primary">
          {t("view")} →
        </span>
      </Link>
    </PageContainer>
  );
}

function CurrentPlanLoading() {
  const t = useTranslations("Home");

  return (
    <section className="rounded-lg bg-surface p-lg shadow-sm">
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
    <section className="rounded-lg bg-surface p-lg shadow-sm">
      <p className="font-sans text-title-16-bold text-text-primary">
        {t("currentPlanErrorTitle")}
      </p>
      <p className="mt-xs font-sans text-caption-13-regular text-text-secondary">
        {t("currentPlanErrorDescription")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-lg font-sans text-label-14-bold text-action-primary"
      >
        {t("currentPlanRetry")}
      </button>
    </section>
  );
}

function CurrentPlanCard({
  planCode,
  planName,
  monthlyFeeLabel,
  dataLabel,
  voiceLabel,
  selectedBenefitCount,
  joinedAtLabel,
}: {
  planCode: string;
  planName: string;
  monthlyFeeLabel: string;
  dataLabel: string;
  voiceLabel: string;
  selectedBenefitCount: number;
  joinedAtLabel: string | null;
}) {
  const t = useTranslations("Home");

  return (
    <Link
      href={`/plans/${planCode}`}
      className="flex flex-col gap-lg rounded-lg bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
    >
      <div className="flex items-center justify-between gap-md">
        <span className="font-sans text-caption-12-bold text-text-secondary">
          {t("currentPlanEyebrow")}
        </span>
      </div>

      <div className="flex items-start justify-between gap-lg">
        <div className="min-w-0">
          <h2 className="truncate font-sans text-title-20-bold text-text-primary">
            {planName}
          </h2>
          <p className="mt-xs font-sans text-caption-13-bold text-action-primary">
            {monthlyFeeLabel}
          </p>
          {joinedAtLabel && (
            <p className="mt-xs font-sans text-micro-11-regular text-text-tertiary">
              {t("currentPlanJoinedAt", {
                date: joinedAtLabel,
              })}
            </p>
          )}
        </div>

        <ChevronRight
          aria-hidden="true"
          className="mt-xs shrink-0 text-icon-secondary"
          size={20}
        />
      </div>

      <div className="grid grid-cols-3 gap-sm">
        <PlanStat label={t("currentPlanData")} value={dataLabel} />
        <PlanStat label={t("currentPlanVoice")} value={voiceLabel} />
        <PlanStat
          label={t("currentPlanBenefits")}
          value={t("currentPlanBenefitCount", {
            count: selectedBenefitCount,
          })}
        />
      </div>
    </Link>
  );
}

function NoPlanCard() {
  const t = useTranslations("Home");

  return (
    <section className="rounded-lg bg-surface p-lg shadow-sm">
      <div className="flex items-start gap-md">
        <span className="flex size-[40px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
          <ReceiptText size={24} strokeWidth={1.8} />
        </span>
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

function PlanStat({ label, value }: PlanStatProps) {
  return (
    <div className="min-w-0 rounded-md bg-surface-subtle px-sm py-md">
      <p className="truncate font-sans text-micro-11-regular text-text-tertiary">
        {label}
      </p>
      <p className="mt-xs truncate font-sans text-caption-12-bold text-text-primary">
        {value}
      </p>
    </div>
  );
}
