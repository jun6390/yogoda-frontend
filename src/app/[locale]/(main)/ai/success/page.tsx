"use client";

import { Check, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/PageContainer";
import { Link } from "@/i18n/navigation";
import { getCurrentPlan, getPlanByCode } from "@/lib/api/plan";
import { useAuthStore } from "@/stores/useAuthStore";

export default function PlanSuccessPage() {
  const t = useTranslations("PlanSuccess");
  const locale = useLocale();
  const userName = useAuthStore((state) => state.user?.name);

  const {
    data: currentPlan,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["plans", "me", "current"],
    queryFn: getCurrentPlan,
  });

  const planCode = currentPlan?.planCode;

  /*
   * 결과 화면 전용 데이터(데이터 제공량, 대표 혜택)를 위해 요금제 상세를 한 번 더 조회함
   * current API는 가입 정보만 담고 있어 데이터량/혜택 텍스트가 없음
   */
  const { data: plan } = useQuery({
    queryKey: ["plans", planCode],
    queryFn: () => getPlanByCode(planCode as string),
    enabled: Boolean(planCode),
  });

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale).format(value);

  if (isPending) {
    return (
      <PageContainer className="flex min-h-full items-center justify-center py-5xl text-center">
        <p className="font-sans text-body-14-regular text-text-secondary">
          {t("loading")}
        </p>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer className="flex min-h-full items-center justify-center py-5xl text-center">
        <p className="font-sans text-body-14-regular text-text-secondary">
          {t("error")}
        </p>
      </PageContainer>
    );
  }

  if (!currentPlan) {
    return (
      <PageContainer className="flex min-h-full flex-col items-center justify-center gap-xl py-5xl text-center">
        <p className="font-sans text-body-14-regular text-text-secondary">
          {t("empty")}
        </p>

        <Link
          href="/"
          className="inline-flex h-[44px] items-center justify-center gap-sm rounded-lg bg-action-primary px-xl font-sans text-label-14-bold text-text-on-primary transition-colors hover:bg-action-primary-hover"
        >
          {t("goHome")}
        </Link>
      </PageContainer>
    );
  }

  const { planName, monthlyFee, savings, selectedOptions } = currentPlan;

  const yearlySavings = savings ? savings.amount * 12 : null;
  const representativePerk = plan?.perks?.[0] ?? null;

  const planSummary = [
    `${formatNumber(monthlyFee)}${t("wonPerMonth")}`,
    plan?.data.display,
    representativePerk,
  ]
    .filter(Boolean)
    .join(` ${t("summaryDivider")} `);

  /*
   * 요금제 자체 정보뿐 아니라 사용자가 실제로 선택한 혜택도 함께 보여주기 위해
   * 저장된 옵션 코드를 요금제 상세의 혜택 옵션 title과 매칭함
   */
  const selectedOptionTitles =
    plan?.choiceBenefits
      .filter((step) => step.stepType === "choice")
      .flatMap((step) => {
        const selectedCodes = selectedOptions[step.code] ?? [];

        return selectedCodes.flatMap((optionCode) => {
          const option = step.options.find((item) => item.code === optionCode);

          return option ? [option.title] : [];
        });
      }) ?? [];

  return (
    <PageContainer className="flex min-h-full flex-col items-center justify-center py-5xl text-center">
      <div className="flex w-full max-w-[360px] flex-col items-center">
        <div className="flex size-[64px] items-center justify-center rounded-full bg-brand-soft text-text-brand motion-safe:animate-[splashPop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]">
          <Check aria-hidden="true" size={32} strokeWidth={3} />
        </div>

        <h1 className="mt-lg select-none font-sans text-title-20-bold text-text-primary motion-safe:animate-[splashFadeUp_0.4s_ease-out_0.15s_both]">
          {t("title")}
        </h1>

        <p className="mt-sm font-sans text-body-14-regular whitespace-pre-line text-text-secondary motion-safe:animate-[splashFadeUp_0.4s_ease-out_0.25s_both]">
          {t("description")}
        </p>

        {savings && savings.amount > 0 && (
          <div className="mt-xl w-full rounded-xl bg-brand-soft px-lg py-xl motion-safe:animate-[splashFadeUp_0.4s_ease-out_0.35s_both]">
            <p className="font-sans text-caption-13-medium text-text-secondary">
              {userName
                ? t("savingsHeading", { name: userName })
                : t("savingsHeadingNoName")}
            </p>

            <p className="mt-sm font-sans text-display-28-bold text-text-brand">
              {t("monthlySavings", { amount: formatNumber(savings.amount) })}
            </p>

            {yearlySavings !== null && yearlySavings > 0 && (
              <p className="mt-sm font-sans text-caption-13-bold text-text-primary">
                {t("yearlySavings", { amount: formatNumber(yearlySavings) })}
              </p>
            )}
          </div>
        )}

        {/* 최초 가입은 비교 대상이 없어 절약 금액 대신 환영 문구를 보여줌 */}
        {savings === null && (
          <div className="mt-xl w-full rounded-xl bg-brand-soft px-lg py-xl motion-safe:animate-[splashFadeUp_0.4s_ease-out_0.35s_both]">
            <p className="font-sans text-label-14-bold text-text-brand">
              {t("firstJoinTitle")}
            </p>
            <p className="mt-xs font-sans text-caption-13-medium text-text-secondary">
              {t("firstJoinDescription")}
            </p>
          </div>
        )}

        <div className="mt-lg w-full rounded-xl bg-surface p-lg text-left shadow-sm motion-safe:animate-[splashFadeUp_0.4s_ease-out_0.45s_both]">
          <p className="font-sans text-caption-13-medium text-text-secondary">
            {t("newPlanSummaryLabel")}
          </p>

          <div className="mt-sm flex items-center gap-xs">
            <CheckCircle2
              aria-hidden="true"
              size={18}
              className="shrink-0 text-success"
            />
            <strong className="font-sans text-title-16-bold text-text-primary">
              {planName}
            </strong>
          </div>

          <p className="mt-xs font-sans text-caption-13-medium text-text-secondary">
            {planSummary}
          </p>

          {selectedOptionTitles.length > 0 && (
            <div className="mt-md border-t border-border-default pt-md">
              <p className="font-sans text-caption-13-medium text-text-secondary">
                {t("selectedBenefitsLabel")}
              </p>

              <ul className="mt-sm flex flex-col gap-xs">
                {selectedOptionTitles.map((title) => (
                  <li
                    key={title}
                    className="flex items-start gap-xs font-sans text-caption-13-medium text-text-primary"
                  >
                    <span aria-hidden="true" className="text-text-secondary">
                      •
                    </span>
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-md border-t border-border-default pt-md">
            <p className="font-sans text-micro-11-regular text-text-tertiary">
              {t("detailNotice")}
            </p>
          </div>
        </div>

        <div className="mt-2xl flex w-full flex-col gap-sm motion-safe:animate-[splashFadeUp_0.4s_ease-out_0.55s_both]">
          <Link
            href="/"
            className="flex h-[52px] w-full items-center justify-center rounded-lg bg-action-primary font-sans text-label-14-bold text-text-on-primary transition-colors hover:bg-action-primary-hover"
          >
            {t("goHome")}
          </Link>

          <Link
            href="/ai"
            className="flex h-[44px] w-full items-center justify-center rounded-lg font-sans text-label-14-bold text-text-secondary hover:text-text-primary"
          >
            {t("backToChat")}
          </Link>

          <Link
            href={`/plans/${currentPlan.planCode}`}
            className="flex h-[44px] w-full items-center justify-center rounded-lg font-sans text-label-14-bold text-text-secondary hover:text-text-primary"
          >
            {t("goToPlanDetail")}
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
