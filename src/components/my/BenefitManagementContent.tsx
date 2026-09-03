"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, Gift } from "lucide-react";
import { useTranslations } from "next-intl";

import { MySubpageHeader } from "@/components/my/MySubpageHeader";
import { PlanVisual } from "@/components/plans/PlanVisual";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Link } from "@/i18n/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { getCurrentPlan, getPlanByCode } from "@/lib/api/plan";
import { useAuthStore } from "@/stores/useAuthStore";

export function BenefitManagementContent() {
  const t = useTranslations("MyBenefits");
  const hydrated = useHydrated();
  const accessToken = useAuthStore((state) => state.accessToken);

  const currentPlanQuery = useQuery({
    queryKey: ["plans", "me", "current"],
    queryFn: getCurrentPlan,
    enabled: hydrated && Boolean(accessToken),
    retry: false,
  });
  const currentPlan = currentPlanQuery.data;

  const planDetailQuery = useQuery({
    queryKey: ["plans", currentPlan?.planCode],
    queryFn: () => getPlanByCode(currentPlan!.planCode),
    enabled: Boolean(currentPlan?.planCode),
    retry: false,
  });
  const plan = planDetailQuery.data;

  /* 저장된 옵션 코드를 요금제 선택 단계의 사용자 표시 정보로 변환함 */
  const selectedBenefits =
    plan?.choiceBenefits.flatMap((step) => {
      const selectedCodes = new Set(
        currentPlan?.selectedOptions[step.code] ?? [],
      );

      return step.options
        .filter((option) => selectedCodes.has(option.code))
        .map((option) => ({
          code: option.code,
          title: option.title,
          description: option.description,
          category: step.title,
        }));
    }) ?? [];

  const isLoading =
    !hydrated ||
    currentPlanQuery.isPending ||
    (Boolean(currentPlan) && planDetailQuery.isPending);
  const isError = currentPlanQuery.isError || planDetailQuery.isError;

  return (
    <div className="min-h-full bg-background pb-3xl">
      <MySubpageHeader title={t("title")} backLabel={t("back")} />

      <div className="space-y-2xl px-page py-xl">
        {isLoading ? (
          <div className="space-y-md">
            <div className="h-[104px] animate-pulse rounded-lg bg-surface-subtle" />
            <div className="h-[104px] animate-pulse rounded-lg bg-surface-subtle" />
          </div>
        ) : isError ? (
          <ErrorState
            title={t("loadError")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => {
              if (currentPlanQuery.isError) {
                currentPlanQuery.refetch();
              } else {
                planDetailQuery.refetch();
              }
            }}
          />
        ) : !currentPlan ? (
          <section className="rounded-lg border border-border-default bg-surface p-lg shadow-sm">
            <h2 className="font-sans text-title-18-bold text-text-primary">
              {t("noPlan")}
            </h2>
            <p className="mt-xs font-sans text-body-14-regular text-text-secondary">
              {t("noPlanDescription")}
            </p>
            <Link
              href="/plans"
              className="mt-lg inline-flex items-center gap-xs font-sans text-label-14-bold text-text-brand"
            >
              {t("explorePlans")}
              <ChevronRight aria-hidden="true" size={18} />
            </Link>
          </section>
        ) : (
          <>
            <section className="-mx-page -mt-xl flex min-h-[116px] items-center justify-between gap-lg bg-surface px-page py-xl">
              <div className="min-w-0">
                <p className="font-sans text-caption-12-regular text-text-secondary">
                  {t("currentPlan")}
                </p>
                <h1 className="mt-xs truncate font-sans text-title-20-bold text-text-primary">
                  {currentPlan.planName}
                </h1>
                <span className="mt-sm block font-sans text-caption-12-bold text-text-brand">
                  {t("selectedCount", { count: selectedBenefits.length })}
                </span>
              </div>
              <PlanVisual planName={currentPlan.planName} />
            </section>

            <section>
              {selectedBenefits.length > 0 ? (
                <div className="space-y-sm">
                  {selectedBenefits.map((benefit) => (
                    <BenefitCard
                      key={benefit.code}
                      eyebrow={benefit.category}
                      title={benefit.title}
                      description={benefit.description}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  heading={t("emptySelected")}
                  description={t("emptySelectedDescription")}
                  className="w-full"
                />
              )}
            </section>

            {plan && plan.benefitDetails.length > 0 && (
              <section>
                <h2 className="font-sans text-title-16-bold text-text-primary">
                  {t("includedTitle")}
                </h2>
                <div className="mt-md divide-y divide-border-default rounded-lg border border-border-default bg-surface px-lg shadow-sm">
                  {plan.benefitDetails.map((benefit) => (
                    <div
                      key={`${benefit.category}-${benefit.title}`}
                      className="flex min-h-[64px] items-start gap-md py-lg"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-xs shrink-0 text-icon-brand"
                        size={18}
                      />
                      <div className="min-w-0">
                        <strong className="block font-sans text-label-14-medium text-text-primary">
                          {benefit.title}
                        </strong>
                        {benefit.description && (
                          <p className="mt-xs font-sans text-caption-12-regular text-text-secondary">
                            {benefit.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <Link
              href={`/plans/${currentPlan.planCode}`}
              className="flex h-[48px] items-center justify-center rounded-lg border border-border-default bg-surface font-sans text-label-14-bold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            >
              {t("viewPlan")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function BenefitCard({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string | null;
}) {
  return (
    <article className="flex items-start gap-md rounded-lg border border-border-default bg-surface p-lg shadow-sm">
      <span className="flex size-[36px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
        <Gift aria-hidden="true" size={20} />
      </span>
      <div className="min-w-0">
        <span className="font-sans text-caption-12-regular text-text-secondary">
          {eyebrow}
        </span>
        <h3 className="mt-xs font-sans text-label-14-bold text-text-primary">
          {title}
        </h3>
        {description && (
          <p className="mt-xs font-sans text-caption-12-regular text-text-secondary">
            {description}
          </p>
        )}
      </div>
    </article>
  );
}
