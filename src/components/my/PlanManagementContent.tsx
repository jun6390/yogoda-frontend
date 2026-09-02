"use client";

import { useSyncExternalStore, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { MySubpageHeader } from "@/components/my/MySubpageHeader";
import { PlanVisual } from "@/components/plans/PlanVisual";
import { Button } from "@/components/ui/Button/Button";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Link, useRouter } from "@/i18n/navigation";
import {
  cancelCurrentPlan,
  getCurrentPlan,
  getPlanByCode,
} from "@/lib/api/plan";
import { useAuthStore } from "@/stores/useAuthStore";

const subscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function PlanManagementContent() {
  const t = useTranslations("MyPlan");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const currentPlanQuery = useQuery({
    queryKey: ["plans", "me", "current"],
    queryFn: getCurrentPlan,
    // persist 토큰 복원 전에 보호 API를 호출하지 않도록 hydration 이후 조회함
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

  const cancelMutation = useMutation({
    mutationFn: cancelCurrentPlan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["plans", "me", "current"],
      });
      setIsCancelDialogOpen(false);
      router.replace("/my");
    },
  });

  const plan = planDetailQuery.data;
  const selectedBenefitCount = currentPlan
    ? Object.values(currentPlan.selectedOptions).reduce(
        (total, options) => total + options.length,
        0,
      )
    : 0;
  const joinedAt = currentPlan?.joinedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(currentPlan.joinedAt),
      )
    : t("unknown");
  const monthlyFee = plan
    ? t("monthlyFee", {
        amount: new Intl.NumberFormat(locale).format(plan.monthlyFee),
      })
    : t("checking");

  return (
    <div className="min-h-full bg-background pb-3xl">
      <MySubpageHeader title={t("title")} backLabel={t("back")} />

      <div className="space-y-xl px-page py-xl">
        {!hydrated || currentPlanQuery.isPending ? (
          <div className="h-[220px] animate-pulse rounded-lg border border-border-default bg-surface-subtle shadow-sm" />
        ) : currentPlanQuery.isError ? (
          <ErrorState
            title={t("loadError")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => currentPlanQuery.refetch()}
          />
        ) : !currentPlan ? (
          <section className="rounded-lg border border-border-default bg-surface p-lg shadow-sm">
            <h2 className="font-sans text-title-18-bold text-text-primary">
              {t("noPlan")}
            </h2>
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
            <section className="rounded-lg border border-border-default bg-surface p-lg shadow-sm">
              <div className="flex items-start justify-between gap-lg">
                <div className="min-w-0">
                  <span className="font-sans text-caption-12-bold text-text-secondary">
                    {t("currentPlan")}
                  </span>
                  <h2 className="mt-sm truncate font-sans text-title-20-bold text-text-primary">
                    {currentPlan.planName}
                  </h2>
                  <p className="mt-xs font-sans text-label-14-bold text-text-brand">
                    {monthlyFee}
                  </p>
                </div>
                <PlanVisual planName={currentPlan.planName} className="mt-xs" />
              </div>

              <dl className="mt-xl divide-y divide-border-default border-t border-border-default">
                <PlanInfoRow label={t("joinedAt")} value={joinedAt} />
                <PlanInfoRow
                  label={t("data")}
                  value={plan?.data.display ?? t("checking")}
                />
                <PlanInfoRow
                  label={t("voice")}
                  value={plan?.voice ?? t("checking")}
                />
                <PlanInfoRow
                  label={t("sms")}
                  value={plan?.sms ?? t("checking")}
                />
                <PlanInfoRow
                  label={t("selectedBenefits")}
                  value={t("benefitCount", { count: selectedBenefitCount })}
                />
              </dl>
            </section>

            {planDetailQuery.isError && (
              <ErrorState
                title={t("detailError")}
                description={t("loadErrorDescription")}
                retryLabel={t("retry")}
                onRetry={() => planDetailQuery.refetch()}
              />
            )}

            <Link
              href="/plans"
              className="flex h-[52px] items-center justify-center rounded-lg bg-action-primary px-xl font-sans text-title-16-bold text-text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            >
              {t("changePlan")}
            </Link>
            <button
              type="button"
              onClick={() => setIsCancelDialogOpen(true)}
              className="flex h-[48px] w-full items-center justify-center font-sans text-label-14-bold text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            >
              {t("cancelPlan")}
            </button>
          </>
        )}
      </div>

      {isCancelDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-xl sm:items-center"
          onMouseDown={() => setIsCancelDialogOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-plan-title"
            className="w-full max-w-[350px] rounded-xl bg-surface p-2xl shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="flex size-[40px] items-center justify-center rounded-full bg-error-soft text-error">
              <AlertTriangle aria-hidden="true" size={22} />
            </span>
            <h2
              id="cancel-plan-title"
              className="mt-lg font-sans text-title-18-bold text-text-primary"
            >
              {t("cancelTitle")}
            </h2>
            <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
              {t("cancelDescription")}
            </p>
            {cancelMutation.isError && (
              <p className="mt-md font-sans text-caption-13-bold text-error">
                {t("cancelError")}
              </p>
            )}
            <div className="mt-2xl grid grid-cols-2 gap-sm">
              <Button
                variant="secondary"
                onClick={() => setIsCancelDialogOpen(false)}
                disabled={cancelMutation.isPending}
                className="h-[48px] px-md"
              >
                {t("keepPlan")}
              </Button>
              <Button
                onClick={() => cancelMutation.mutate()}
                loading={cancelMutation.isPending}
                className="h-[48px] bg-error px-md hover:bg-error"
              >
                {t("confirmCancel")}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function PlanInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-lg py-md">
      <dt className="font-sans text-body-14-regular text-text-secondary">
        {label}
      </dt>
      <dd className="text-right font-sans text-label-14-medium text-text-primary">
        {value}
      </dd>
    </div>
  );
}
