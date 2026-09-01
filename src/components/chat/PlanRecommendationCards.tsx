"use client";

import { useRef, useState } from "react";
import { ChevronRight, Phone, Wifi } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/Badge/Badge";
import { HighlightedText } from "@/components/ui/HighlightedText/HighlightedText";
import { NergetPlanBadge } from "@/components/plans/NergetPlanBadge";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getCurrentPlan } from "@/lib/api/plan";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ChatPlanCard } from "@/types/chat";

interface PlanRecommendationCardsProps {
  plans: ChatPlanCard[];
}

// "월 46,000원" → 숫자 부분만("46,000") 큰 글씨로 강조하기 위해 분리함
function parsePriceNumber(price: string): string {
  return price.match(/[\d,]+/)?.[0] ?? price;
}

// "너겟46" 같은 요금제명에서 티켓 뱃지에 넣을 숫자만 뽑아냄. 숫자가 없으면 뱃지를 생략함
function parseTicketNumber(name: string): string | null {
  return name.match(/\d+/)?.[0] ?? null;
}

// specs.service가 "데이터 · 통화" 형태(" · "로 구분)로 내려오는 걸 행 단위로 분리함.
// 아이콘은 첫 항목=데이터, 두 번째 항목=통화로 가정하고, 그 외엔 기본 아이콘을 씀
const SPEC_ICONS = [Wifi, Phone];
function splitSpecs(specs: string): string[] {
  return specs
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * AI가 추천한 요금제 카드를 가로로 스크롤하며 보는 캐러셀.
 * 현재 보고 있는 카드 인덱스는 이 컴포넌트 안에서만 쓰이는 표시용 상태라 여기서 관리함.
 */
export function PlanRecommendationCards({
  plans,
}: PlanRecommendationCardsProps) {
  const t = useTranslations("AIChat");
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const accessToken = useAuthStore((state) => state.accessToken);

  /*
   * 비교 버튼은 현재 가입 요금제가 있는 사용자에게만 표시함
   * 가입 이력이 없으면 비교 대상이 없으므로 버튼을 숨김
   */
  const { data: currentPlan } = useQuery({
    queryKey: ["plans", "me", "current"],
    queryFn: getCurrentPlan,
    enabled: Boolean(accessToken),
    retry: false,
  });

  const hasCurrentPlan = Boolean(currentPlan?.planCode);

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
        {plans.map((plan, idx) => {
          const priceNumber = parsePriceNumber(plan.price);
          const specRows = splitSpecs(plan.specs);
          const ticketNumber = parseTicketNumber(plan.name);

          return (
            <div
              key={idx}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/plans/${plan.code}?from=chat`)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                router.push(`/plans/${plan.code}?from=chat`);
              }}
              className="flex flex-col rounded-2xl bg-surface border border-border-default shadow-sm w-62.5 shrink-0 snap-start overflow-hidden cursor-pointer transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-action-primary"
            >
              {/* 히어로 영역: 순위/매칭률과 요금제명·가격을 강조.
                  배경은 내 채팅 말풍선과 같은 토큰(bg-bubble-user)을 써서, 다크모드에서도
                  (남색 계열로) 자연스럽게 어울리도록 함 */}
              <div className="flex flex-col gap-xs bg-bubble-user px-lg pt-md pb-lg">
                <div className="flex items-center justify-between gap-sm">
                  {/* 1순위만 진하게 채우고, 나머지는 연하게 채워서 순위를 구분함 */}
                  <Badge
                    variant="solid"
                    className={idx !== 0 ? "bg-action-primary/60" : undefined}
                  >
                    {plan.badge}
                  </Badge>
                  {/* 매칭률: 뱃지와 같은 줄 오른쪽 끝에 텍스트로만 표시 */}
                  <span className="font-sans text-caption-12-bold text-action-primary shrink-0">
                    {plan.matchRate}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-sm">
                  <div className="flex flex-col gap-xs min-w-0">
                    <strong className="font-sans text-title-18-bold text-text-primary">
                      {plan.name}
                    </strong>
                    <div className="flex items-baseline gap-xs">
                      <span className="font-sans text-title-20-bold text-text-primary">
                        {priceNumber}
                      </span>
                      <span className="font-sans text-caption-12-medium text-text-secondary">
                        원 / 월
                      </span>
                    </div>
                  </div>
                  {/* 요금제 상세 페이지와 동일한 티켓 뱃지를 재사용함 */}
                  {ticketNumber && (
                    <NergetPlanBadge number={ticketNumber} size="sm" />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-sm px-lg pt-md pb-lg">
                <div className="flex flex-col gap-xs">
                  {specRows.map((spec, specIdx) => {
                    const SpecIcon = SPEC_ICONS[specIdx] ?? Wifi;
                    return (
                      <div key={specIdx} className="flex items-center gap-xs">
                        <SpecIcon
                          size={14}
                          className="text-text-tertiary shrink-0"
                        />
                        <span className="font-sans text-caption-12-medium text-text-secondary">
                          {spec}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* AI가 이 요금제를 추천한 이유. 사용자가 채팅으로 말한 조건과 실제로
                    일치하는 구절만 AI가 **굵게** 표시해서 보내주는데, 그 부분만 프라이머리 색으로 강조함 */}
                <div className="rounded-md bg-surface-subtle px-sm py-xs">
                  <span className="font-sans text-caption-12-medium leading-relaxed text-text-secondary">
                    <HighlightedText text={plan.savings} />
                  </span>
                </div>
              </div>

              {/* 현재 가입 요금제가 있을 때만 비교 버튼 표시. 카드 전체 클릭(상세 이동)과
                  겹치지 않도록 클릭 전파를 막음. mt-auto로 바닥에 고정 — AI 한줄평이 몇
                  줄이든 카드마다 버튼 위치가 흔들리지 않게 함 */}
              {hasCurrentPlan && (
                <div className="px-lg pb-lg mt-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/ai/compare?code=${plan.code}&from=chat`);
                    }}
                    className="flex items-center justify-start gap-xs w-full font-sans text-caption-13-medium text-text-secondary hover:text-text-primary"
                  >
                    {t("comparePlan")} <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
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
        href="/plans?from=chat"
        className="flex items-center gap-xs font-sans text-caption-13-bold text-text-secondary hover:text-text-primary"
      >
        {t("explorePlans")} <ChevronRight size={16} />
      </Link>
    </div>
  );
}
