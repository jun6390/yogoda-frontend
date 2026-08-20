"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { ChatPlanCard } from "@/types/chat";

interface PlanRecommendationCardsProps {
  plans: ChatPlanCard[];
}

/**
 * AI가 추천한 요금제 카드를 가로로 스크롤하며 보는 캐러셀.
 * 현재 보고 있는 카드 인덱스는 이 컴포넌트 안에서만 쓰이는 표시용 상태라 여기서 관리함.
 */
export function PlanRecommendationCards({
  plans,
}: PlanRecommendationCardsProps) {
  const t = useTranslations("AIChat");
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = e.currentTarget;
    if (clientWidth > 0) {
      setActiveIdx(Math.round(scrollLeft / clientWidth));
    }
  };

  return (
    <div className="flex flex-col gap-sm w-[290px] overflow-hidden">
      {/* 가로 스크롤 카드 리스트 (양옆 카드 피크 효과 적용) */}
      <div
        onScroll={handleScroll}
        className="flex gap-md overflow-x-auto snap-x snap-mandatory scrollbar-none pb-xs w-full"
      >
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-sm rounded-lg bg-surface border border-border-default p-lg shadow-sm w-[250px] shrink-0 snap-start"
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "rounded-full px-md py-sm font-sans text-micro-11-bold",
                  idx === 0
                    ? "bg-action-primary text-text-on-primary"
                    : "bg-surface-subtle text-text-secondary border border-border-default",
                )}
              >
                {plan.badge}
              </span>
              <span className="font-sans text-caption-12-bold text-text-brand">
                {plan.matchRate}
              </span>
            </div>

            <div className="space-y-xs">
              <strong className="block font-sans text-title-18-bold text-text-primary">
                {plan.name}
              </strong>
              <span className="block font-sans text-caption-13-bold text-text-primary">
                {plan.price}
              </span>
              <p className="font-sans text-micro-11-regular text-text-secondary">
                {plan.specs}
              </p>
            </div>

            <div className="border-t border-border-default pt-md space-y-md">
              <span className="block font-sans text-caption-12-bold text-success">
                {plan.savings}
              </span>

              <button className="flex items-center gap-xs font-sans text-caption-12-medium text-text-secondary hover:text-text-primary">
                내 요금제와 비교 <ChevronRight size={14} />
              </button>

              <button className="w-full h-[40px] rounded-lg bg-action-primary text-text-on-primary font-sans text-caption-13-bold hover:bg-action-primary-hover transition-colors">
                {t("selectBtn")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 캐러셀 인디케이터 도트 */}
      <div className="flex justify-center gap-xs pt-xs">
        {plans.map((_, idx) => (
          <span
            key={idx}
            className={cn(
              "size-xs rounded-full transition-all duration-300",
              activeIdx === idx ? "bg-action-primary w-md" : "bg-border-strong",
            )}
          />
        ))}
      </div>
    </div>
  );
}
