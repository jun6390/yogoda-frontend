"use client";

import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";

import { getPlans } from "@/lib/api/plan";
import { PlanRow } from "@/components/ui/PlanRow/PlanRow";

export function PlanBrowseContent() {
  const {
    data: plans = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });

  if (isPending) {
    return (
      <p className="mt-xl text-caption-13-medium text-text-secondary">
        요금제를 불러오는 중이에요.
      </p>
    );
  }

  if (isError) {
    return (
      <p className="mt-xl text-caption-13-medium text-text-secondary">
        요금제를 불러오지 못했어요.
      </p>
    );
  }

  return (
    <div className="mt-xl flex flex-col gap-md">
      {plans.map((plan, index) => (
        <Fragment key={plan._id}>
          <PlanRow
            name={plan.name}
            price={`${plan.monthlyFee.toLocaleString()}원 / 월`}
            description={`${plan.data.display} · ${plan.voice}`}
          />

          {index < plans.length - 1 && (
            <div
              aria-hidden="true"
              className="h-[0.5px] w-full bg-border-default"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
