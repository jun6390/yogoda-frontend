"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Chip } from "@/components/ui/Chip/Chip";

type PlanFilter = "all" | "5g" | "data" | "ott" | "senior";

export function PlanFilterChips() {
  const t = useTranslations("Plans");
  const [selectedFilter, setSelectedFilter] = useState<PlanFilter>("all");

  const filters = [
    { value: "all", label: t("filterAll") },
    { value: "5g", label: t("filter5g") },
    { value: "data", label: t("filterData") },
    { value: "ott", label: t("filterOtt") },
    { value: "senior", label: t("filterSenior") },
  ] as const;

  return (
    <div className="flex gap-sm overflow-x-auto">
      {filters.map((filter) => {
        const isSelected = selectedFilter === filter.value;

        return (
          <Chip
            key={filter.value}
            selected={isSelected}
            onClick={() => setSelectedFilter(filter.value)}
            className={
              isSelected
                ? "h-auto px-[14px] py-sm text-caption-13-bold"
                : "h-auto px-[14px] py-sm text-caption-13-medium"
            }
          >
            {filter.label}
          </Chip>
        );
      })}
    </div>
  );
}
