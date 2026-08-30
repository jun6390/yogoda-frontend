"use client";

import Image from "next/image";

import { NergetPlanBadge } from "./NergetPlanBadge";

import { cn } from "@/lib/utils";

interface PlanVisualProps {
  planName: string;
  className?: string;
}

export function PlanVisual({ planName, className }: PlanVisualProps) {
  const nergetPlanNumber = getNergetPlanNumber(planName);

  return (
    <span
      className={cn(
        "flex h-[53px] w-[90px] shrink-0 items-center justify-center",
        className,
      )}
    >
      {nergetPlanNumber ? (
        <NergetPlanBadge number={nergetPlanNumber} size="sm" />
      ) : (
        <span className="flex size-full items-center justify-center rounded-md bg-surface-subtle">
          <Image
            src="/brand-logos/uplus.svg"
            alt=""
            width={42}
            height={24}
            className="h-auto w-[42px]"
          />
        </span>
      )}
    </span>
  );
}

function getNergetPlanNumber(planName: string) {
  return planName.match(/(?:너겟|nerget)\s*(\d+)/i)?.[1] ?? null;
}
