"use client";

import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/Badge/Badge";
import { Link } from "@/i18n/navigation";
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
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = e.currentTarget;
    if (clientWidth > 0) {
      setActiveIdx(Math.round(scrollLeft / clientWidth));
    }
  };

  // 하단 캐러셀 인디케이터 점을 클릭하면 해당 카드로 이동
  const goToCard = (idx: number) => {
    cardRefs.current[idx]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  return (
    <div className="flex flex-col gap-sm w-[290px] overflow-hidden">
      {/*  카드 리스트 */}
      <div
        onScroll={handleScroll}
        className="flex gap-md overflow-x-auto snap-x snap-mandatory scrollbar-none pb-xs w-full"
      >
        {plans.map((plan, idx) => (
          <div
            key={idx}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            className="flex flex-col gap-sm rounded-lg bg-surface border border-border-default p-lg shadow-sm w-[250px] shrink-0 snap-start"
          >
            <div className="flex items-center justify-between">
              {/* 순위 뱃지 */}
              <Badge variant={idx === 0 ? "accent" : "default"}>
                {plan.badge}
              </Badge>
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
              <p className="font-sans text-[10px] leading-[13px] text-text-secondary">
                {plan.specs}
              </p>
            </div>

            <div className="border-t border-border-default pt-md space-y-md">
              <span className="block font-sans text-caption-12-bold text-success">
                {plan.savings}
              </span>

              <button className="flex items-center gap-xs font-sans text-caption-12-medium text-text-secondary hover:text-text-primary">
                {t("comparePlan")} <ChevronRight size={14} />
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
          <button
            key={idx}
            type="button"
            aria-label={t("carouselDotAriaLabel", { index: idx + 1 })}
            onClick={() => goToCard(idx)}
            className="p-xs -m-xs"
          >
            <span
              className={cn(
                "block size-xs rounded-full transition-all duration-300",
                activeIdx === idx
                  ? "bg-action-primary w-md"
                  : "bg-border-strong",
              )}
            />
          </button>
        ))}
      </div>

      {/* 다른 요금제 탐색하기: 요금제 전체 목록 페이지로 이동 */}
      <Link
        href="/plans"
        className="flex items-center gap-xs font-sans text-caption-13-bold text-text-secondary hover:text-text-primary"
      >
        {t("explorePlans")} <ChevronRight size={16} />
      </Link>
    </div>
  );
}
