"use client";

import { Check, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Spinner } from "@/components/ui/Spinner/Spinner";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { getCurrentPlan, getPlanByCode } from "@/lib/api/plan";
import { useAuthStore } from "@/stores/useAuthStore";

interface PlanSuccessContentProps {
  /** 하단 버튼 슬롯 — page/chat 각각 다른 버튼을 주입 */
  actions: ReactNode;
  /** 채팅 인라인 모드이면 패딩·정렬을 좀 더 compact하게 */
  variant?: "page" | "chat";
}

/**
 * 가입 완료 결과 화면 공통 컨텐츠.
 * ai/success/page.tsx 와 SignupCompleteCard 양쪽에서 재사용.
 */
export function PlanSuccessContent({
  actions,
  variant = "page",
}: PlanSuccessContentProps) {
  const t = useTranslations("PlanSuccess");
  const locale = useLocale();
  const userName = useAuthStore((state) => state.user?.name);

  const {
    data: currentPlan,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["plans", "me", "current"],
    queryFn: getCurrentPlan,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const planCode = currentPlan?.planCode;

  const { data: plan } = useQuery({
    queryKey: ["plans", planCode],
    queryFn: () => getPlanByCode(planCode as string),
    enabled: Boolean(planCode),
  });

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale).format(value);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-2xl">
        <Spinner size="md" />
      </div>
    );
  }

  if (isError || !currentPlan) {
    return (
      <ErrorState
        className="py-xl"
        title={t("error")}
        description={t("errorDescription")}
        retryLabel={t("retry")}
        onRetry={refetch}
      />
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

  const isChat = variant === "chat";

  return (
    <div
      className={`flex w-full flex-col items-center text-center ${
        isChat ? "gap-lg py-lg px-lg" : "gap-xl py-5xl"
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-brand-soft text-text-brand motion-safe:animate-[splashPop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both] ${
          isChat ? "size-[52px]" : "size-[64px]"
        }`}
      >
        <Check aria-hidden="true" size={isChat ? 26 : 32} strokeWidth={3} />
      </div>

      <div className="motion-safe:animate-[splashFadeUp_0.4s_ease-out_0.15s_both]">
        <h1
          className={`select-none font-sans text-text-primary ${
            isChat ? "text-title-18-bold" : "text-title-20-bold"
          }`}
        >
          {t("title")}
        </h1>
        <p
          className={`mt-sm font-sans text-text-secondary whitespace-pre-line ${
            isChat ? "text-caption-12-medium" : "text-body-14-regular"
          }`}
        >
          {t("description")}
        </p>
      </div>

      {savings && savings.amount > 0 && (
        <div className="w-full rounded-xl bg-brand-soft px-lg py-xl motion-safe:animate-[splashFadeUp_0.4s_ease-out_0.35s_both]">
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

      {savings === null && (
        <div className="w-full rounded-xl bg-brand-soft px-lg py-xl motion-safe:animate-[splashFadeUp_0.4s_ease-out_0.35s_both]">
          <p className="font-sans text-label-14-bold text-text-brand">
            {t("firstJoinTitle")}
          </p>
          <p className="mt-xs font-sans text-caption-13-medium text-text-secondary">
            {t("firstJoinDescription")}
          </p>
        </div>
      )}

      <div className="w-full rounded-xl bg-surface p-lg text-left shadow-sm motion-safe:animate-[splashFadeUp_0.4s_ease-out_0.45s_both]">
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

      <div className="w-full motion-safe:animate-[splashFadeUp_0.4s_ease-out_0.55s_both]">
        {actions}
      </div>
    </div>
  );
}
