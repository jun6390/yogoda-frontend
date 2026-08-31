"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Spinner } from "@/components/ui/Spinner/Spinner";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Chip } from "@/components/ui/Chip/Chip";
import { Input } from "@/components/ui/Input/Input";
import { PlanRow } from "@/components/ui/PlanRow/PlanRow";
import { Select } from "@/components/ui/Select/Select";
import { usageReport } from "@/data/usageReport";
import { getComparedPlans, getCurrentPlan, getPlans } from "@/lib/api/plan";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Plan } from "@/types/plan";

type PlanCategory = "popular" | "all" | "unlimited";
type PlanSort = "default" | "fit" | "priceHigh" | "priceLow";

const averageUsageMb =
  (usageReport.history.reduce((sum, item) => sum + item.amount, 0) /
    usageReport.history.length) *
  1024;
const usageWithBufferMb = averageUsageMb * 1.15;

function getUsageFitRank(plan: Plan) {
  const allowance = plan.data.amountMb;

  if (allowance === null) return Number.MAX_SAFE_INTEGER / 2;
  if (allowance >= usageWithBufferMb) return allowance - usageWithBufferMb;

  return Number.MAX_SAFE_INTEGER / 4 + (usageWithBufferMb - allowance);
}

export function PlanBrowseContent() {
  const t = useTranslations("Plans");
  const locale = useLocale();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [activeCategory, setActiveCategory] = useState<PlanCategory>("popular");
  const [activeSort, setActiveSort] = useState<PlanSort>("default");
  const [keyword, setKeyword] = useState("");
  const deferredKeyword = useDeferredValue(keyword);

  const {
    data: plans = [],
    isPending,
    isError,
    refetch,
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
    let nextPlans = plans;

    if (activeCategory === "popular") {
      nextPlans = plans
        .filter((plan) => plan.isPopular)
        .sort(
          (a, b) =>
            (a.popularOrder ?? Number.MAX_SAFE_INTEGER) -
            (b.popularOrder ?? Number.MAX_SAFE_INTEGER),
        );
    }

    if (activeCategory === "unlimited") {
      nextPlans = plans.filter((plan) => plan.data.amountMb === null);
    }

    const normalizedKeyword = deferredKeyword.trim().toLocaleLowerCase(locale);

    if (normalizedKeyword) {
      nextPlans = nextPlans.filter((plan) =>
        [
          plan.name,
          plan.code,
          plan.network,
          plan.data.display,
          plan.data.sharingDisplay,
          plan.voice,
          plan.sms,
          ...plan.perks,
          ...plan.tags,
          ...plan.recommendationTags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase(locale)
          .includes(normalizedKeyword),
      );
    }

    if (activeSort === "priceHigh") {
      return [...nextPlans].sort((a, b) => b.monthlyFee - a.monthlyFee);
    }

    if (activeSort === "priceLow") {
      return [...nextPlans].sort((a, b) => a.monthlyFee - b.monthlyFee);
    }

    if (activeSort === "fit") {
      return [...nextPlans].sort(
        (a, b) => getUsageFitRank(a) - getUsageFitRank(b),
      );
    }

    return nextPlans;
  }, [activeCategory, activeSort, deferredKeyword, locale, plans]);

  const filters: {
    value: PlanCategory;
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
  ];

  const sortOptions: { value: PlanSort; label: string }[] = [
    { value: "default", label: t("sortDefault") },
    ...(accessToken
      ? ([{ value: "fit", label: t("sortUsageFit") }] as const)
      : []),
    { value: "priceHigh", label: t("filterPriceHigh") },
    { value: "priceLow", label: t("filterPriceLow") },
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
      <ErrorState
        className="mt-xl"
        title={t("error")}
        retryLabel={t("retry")}
        onRetry={refetch}
      />
    );
  }

  return (
    <>
      <div className="mt-xl flex items-center gap-md">
        <div
          role="group"
          aria-label={t("filterLabel")}
          className="flex min-w-0 flex-1 gap-sm overflow-x-auto"
        >
          {filters.map((filter) => (
            <Chip
              key={filter.value}
              selected={activeCategory === filter.value}
              onClick={() => setActiveCategory(filter.value)}
              className="h-[36px] shrink-0 px-[14px] text-caption-13-bold"
            >
              {filter.label}
            </Chip>
          ))}
        </div>

        <Select
          value={activeSort}
          options={sortOptions}
          onChange={setActiveSort}
          ariaLabel={t("sortLabel")}
          className="w-[140px] shrink-0"
          triggerClassName="h-[36px] min-h-[36px] rounded-full bg-surface text-text-secondary"
          menuClassName="left-auto right-0 min-w-[140px]"
        />
      </div>

      <div className="relative mt-md">
        <Search
          aria-hidden="true"
          className="absolute left-md top-1/2 z-[1] -translate-y-1/2 text-icon-secondary"
          size={19}
        />
        <Input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="pl-[40px]"
        />
      </div>

      <div className="mt-xl flex flex-col gap-lg">
        {filteredPlans.length === 0 ? (
          <p className="rounded-lg border border-border-default bg-surface p-lg text-center font-sans text-body-14-regular text-text-secondary shadow-sm">
            {t("searchEmpty")}
          </p>
        ) : (
          filteredPlans.map((plan) => (
            <PlanRow
              key={plan.code}
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
          ))
        )}
      </div>
    </>
  );
}
