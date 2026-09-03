"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { PageSpinner, Spinner } from "@/components/ui/Spinner/Spinner";
import { Button } from "@/components/ui/Button/Button";
import { useRouter } from "@/i18n/navigation";
import {
  changePlan,
  getCurrentPlan,
  getPlanByCode,
  joinPlan,
} from "@/lib/api/plan";
import { getPlanJoinDraftKey } from "@/lib/plan-join-draft";

type SelectedBenefits = Record<string, string[]>;

export default function PlanJoinConfirmPage() {
  const { code } = useParams<{ code: string }>();

  return <PlanJoinConfirmContent key={code} code={code} />;
}

interface PlanJoinConfirmContentProps {
  code: string;
}

function PlanJoinConfirmContent({ code }: PlanJoinConfirmContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("PlanJoinConfirm");
  const locale = useLocale();

  /*
   * 요금제 상세 페이지에서 넘어온 선택값을 최초 렌더 시점에 한 번만 읽음
   * useEffect + setState로 처리하면 불필요한 리렌더가 한 번 더 발생하므로
   * lazy initializer로 state 자체를 sessionStorage 값에서 바로 초기화함
   */
  const [selectedBenefits] = useState<SelectedBenefits | null>(() => {
    const raw = window.sessionStorage.getItem(getPlanJoinDraftKey(code));

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as SelectedBenefits;
    } catch {
      return {};
    }
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * 넘어온 선택값이 없으면(새로고침, 직접 진입 등) 다시 선택할 수 있도록
   * 상세 페이지로 돌려보냄
   */
  useEffect(() => {
    if (selectedBenefits === null) {
      router.replace(`/plans/${code}`);
    }
  }, [selectedBenefits, code, router]);

  const {
    data: plan,
    isPending: isPlanPending,
    isError: isPlanError,
    refetch: refetchPlan,
  } = useQuery({
    queryKey: ["plans", code],
    queryFn: () => getPlanByCode(code),
    enabled: Boolean(code),
  });

  const { data: currentPlan } = useQuery({
    queryKey: ["plans", "me", "current"],
    queryFn: getCurrentPlan,
    retry: false,
  });

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale).format(value);

  if (selectedBenefits === null || isPlanPending) {
    return <PageSpinner label={t("loading")} />;
  }

  if (isPlanError || !plan) {
    return (
      <PageContainer className="py-xl">
        <ErrorState
          title={t("loadError")}
          retryLabel={t("retry")}
          onRetry={() => refetchPlan()}
        />
      </PageContainer>
    );
  }

  const isPlanChange =
    currentPlan !== null &&
    currentPlan !== undefined &&
    currentPlan.planCode !== plan.code;

  const newMonthlyFee = plan.discountFee ?? plan.monthlyFee;

  // 실제 절약 금액은 가입 완료 후 서버가 계산하지만, 확인 단계에서는 미리 같은 방식으로 추정해서 보여줌
  const previousMonthlyFee = isPlanChange
    ? (currentPlan?.monthlyFee ?? null)
    : null;

  const estimatedSavings =
    previousMonthlyFee !== null ? previousMonthlyFee - newMonthlyFee : null;

  const yearlyEstimatedSavings =
    estimatedSavings !== null ? estimatedSavings * 12 : null;

  const selectedOptionTitles = plan.choiceBenefits
    .filter((step) => step.stepType === "choice")
    .flatMap((step) => {
      const selectedCodes = selectedBenefits[step.code] ?? [];

      return selectedCodes.flatMap((optionCode) => {
        const option = step.options.find((item) => item.code === optionCode);

        return option ? [option.title] : [];
      });
    });

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (isPlanChange) {
        await changePlan(code, selectedBenefits);
      } else {
        await joinPlan(code, selectedBenefits);
      }

      window.sessionStorage.removeItem(getPlanJoinDraftKey(code));

      /*
       * 홈/요금제 상세 등 다른 화면이 들고 있는 가입 요금제 캐시가
       * 변경 전 상태로 남아있지 않도록 plans 관련 쿼리를 모두 무효화함
       */
      await queryClient.invalidateQueries({ queryKey: ["plans"] });

      router.replace("/ai/success");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isPlanChange
            ? t("changeError")
            : t("joinError"),
      );

      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageContainer className="pb-[160px] pt-md">
        <div className="flex flex-col gap-xl">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label={t("back")}
              className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-surface"
            >
              <ArrowLeft aria-hidden="true" size={21} />
            </button>

            <h1 className="font-sans text-title-16-bold text-text-primary">
              {t("header")}
            </h1>
          </div>

          <h2 className="select-none font-sans text-title-24-bold whitespace-pre-line text-text-primary">
            {t("title")}
          </h2>

          <section className="rounded-xl bg-surface p-xl">
            <p className="font-sans text-caption-13-medium text-text-secondary">
              {t("pendingPlanLabel")}
            </p>

            <div className="mt-md flex items-baseline justify-between gap-md">
              <strong className="font-sans text-title-18-bold text-text-primary">
                {plan.name}
              </strong>

              <span className="shrink-0 font-sans text-title-24-bold text-text-primary">
                {formatNumber(newMonthlyFee)}
                {t("wonUnit")}
                <span className="ml-2xs font-sans text-caption-13-medium text-text-secondary">
                  {t("perMonth")}
                </span>
              </span>
            </div>

            {selectedOptionTitles.length > 0 && (
              <div className="mt-xl border-t border-border-default pt-xl">
                <p className="font-sans text-caption-13-medium text-text-secondary">
                  {t("conditionsLabel")}
                </p>

                <ul className="mt-md flex flex-col gap-md">
                  {selectedOptionTitles.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-xs font-sans text-label-14-medium text-text-primary"
                    >
                      <span aria-hidden="true" className="text-text-secondary">
                        •
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-xl border-t border-border-default pt-xl">
              <div className="flex items-center justify-between gap-md">
                <span className="font-sans text-title-16-bold text-text-primary">
                  {t("estimatedPayment")}
                </span>

                <strong className="shrink-0 font-sans text-title-20-bold text-text-brand">
                  {formatNumber(newMonthlyFee)}
                  {t("wonUnit")}
                </strong>
              </div>

              {estimatedSavings !== null && estimatedSavings > 0 && (
                <p className="mt-sm font-sans text-caption-13-bold text-text-brand">
                  {t("savingsPreview", {
                    monthly: formatNumber(estimatedSavings),
                    yearly: formatNumber(yearlyEstimatedSavings ?? 0),
                  })}
                </p>
              )}
            </div>
          </section>
        </div>
      </PageContainer>

      <div className="fixed bottom-[72px] left-1/2 z-20 w-full max-w-[446px] -translate-x-1/2 bg-surface px-lg pb-xl pt-lg shadow-[0_-8px_28px_rgb(18_20_31_/_12%)]">
        {submitError && (
          <ErrorState
            className="mb-md"
            title={submitError}
            retryLabel={t("retry")}
            onRetry={handleSubmit}
          />
        )}

        <Button
          className="h-[56px] w-full rounded-xl"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-sm">
              <Spinner size="sm" className="text-text-on-primary" />
              {t("submitting")}
            </span>
          ) : (
            t("submit")
          )}
        </Button>
      </div>
    </>
  );
}
