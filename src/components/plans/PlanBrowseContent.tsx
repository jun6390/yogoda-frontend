"use client";

import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { Spinner, PageSpinner } from "@/components/ui/Spinner/Spinner";
import { Chip } from "@/components/ui/Chip/Chip";
import { PlanRow } from "@/components/ui/PlanRow/PlanRow";
import { getComparedPlans, getCurrentPlan, getPlans } from "@/lib/api/plan";
import { useAuthStore } from "@/stores/useAuthStore";

type PlanFilter = "popular" | "all" | "unlimited" | "priceHigh" | "priceLow";

export function PlanBrowseContent() {
  const t = useTranslations("Plans");
  const locale = useLocale();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [activeFilter, setActiveFilter] = useState<PlanFilter>("popular");

  const {
    data: plans = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["plans", accessToken ? "member-compare" : "public"],
    queryFn: () => (accessToken ? getComparedPlans() : getPlans()),
  });

  const { data: currentPlan } = useQuery({
    queryKey: ["plans", "me", "current"],
    queryFn: getCurrentPlan,
    // 탐색 화면은 비회원도 볼 수 있으므로 로그인한 경우에만 현재 요금제 배지를 조회함
    enabled: Boolean(accessToken),
    retry: false,
  });

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale).format(value);

  const filteredPlans = useMemo(() => {
    if (activeFilter === "popular") {
      return plans
        .filter((plan) => plan.isPopular)
        .sort(
          (a, b) =>
            (a.popularOrder ?? Number.MAX_SAFE_INTEGER) -
            (b.popularOrder ?? Number.MAX_SAFE_INTEGER),
        );
    }

    if (activeFilter === "unlimited") {
      return plans.filter((plan) => plan.data.amountMb === null);
    }

    if (activeFilter === "priceHigh") {
      return [...plans].sort((a, b) => b.monthlyFee - a.monthlyFee);
    }

    if (activeFilter === "priceLow") {
      return [...plans].sort((a, b) => a.monthlyFee - b.monthlyFee);
    }

    return plans;
  }, [activeFilter, plans]);

  const filters: {
    value: PlanFilter;
    label: string;
  }[] = [
    {
      value: "popular",
      label: t("filterPopular"),
    },
    {
      value: "all",
      label: t("filterAll"),
    },
    {
      value: "unlimited",
      label: t("filterUnlimited"),
    },
    {
      value: "priceHigh",
      label: t("filterPriceHigh"),
    },
    {
      value: "priceLow",
      label: t("filterPriceLow"),
    },
  ];

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner
          size="lg"
          className="text-action-primary"
          label={t("loading")}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="mt-xl text-caption-13-medium text-text-secondary">
        {t("error")}
      </p>
    );
  }

  return (
    <>
      <div className="mt-xl flex gap-sm overflow-x-auto">
        {filters.map((filter) => (
          <Chip
            key={filter.value}
            selected={activeFilter === filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className="h-auto shrink-0 px-[14px] py-sm text-caption-13-medium"
          >
            {filter.label}
          </Chip>
        ))}
      </div>

      <div className="mt-xl flex flex-col gap-md">
        {filteredPlans.map((plan, index) => (
          <Fragment key={plan._id}>
            <PlanRow
              name={plan.name}
              planNumber={plan.code.replace("nerget-", "")}
              price={t("monthlyPrice", {
                amount: formatNumber(plan.monthlyFee),
              })}
              description={plan.data.display}
              subDescription={
                plan.data.sharingDisplay
                  ? `${plan.data.sharingDisplay} · ${plan.voice}`
                  : plan.voice
              }
              benefits={plan.perks}
              href={`/plans/${plan.code}`}
              promotionBadge={plan.promotion.badge}
              currentPlanBadge={
                currentPlan?.planCode === plan.code
                  ? t("currentPlanBadge")
                  : undefined
              }
              effectiveMonthlyFee={plan.promotion.effectiveMonthlyFee}
              maxMonthlyBenefit={plan.promotion.maxMonthlyBenefit}
            />

            {index < filteredPlans.length - 1 && (
              <div
                aria-hidden="true"
                className="h-[0.5px] w-full bg-border-default"
              />
            )}
          </Fragment>
        ))}
      </div>
    </>
  );
}
