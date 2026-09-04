"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  Database,
  MessageSquare,
  Phone,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { PageSpinner } from "@/components/ui/Spinner/Spinner";
import { NergetPlanBadge } from "@/components/plans/NergetPlanBadge";
import { Button } from "@/components/ui/Button/Button";
import { BackToChatButton } from "@/components/chat/BackToChatButton";
import { useRouter } from "@/i18n/navigation";
import { getCurrentPlan, getPlanByCode } from "@/lib/api/plan";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PlanChoiceBenefit } from "@/types/plan";
import {
  ChoiceStep,
  InfoStep,
  PlanUsageItem,
  CompactInfo,
} from "@/components/plans/PlanBenefitSteps";
import {
  getActiveSteps,
  getProgressiveSteps,
  isStepComplete,
  sanitizeSelections,
} from "@/lib/plan-benefit-selection";

type SelectedBenefits = Record<string, string[]>;

/*
 * /ai로 이동할 때 매번 다른 값의 쿼리 파라미터를 만들기 위한 헬퍼.
 * Date.now() 등 impure 호출은 컴포넌트 함수 본문에서 직접 하면 안 되므로 분리함
 * (react-hooks/purity)
 */
function createNavigationNonce() {
  return Date.now().toString(36);
}

export default function PlanDetailPage() {
  const { code } = useParams<{ code: string }>();

  return <PlanDetailContent key={code} code={code} />;
}

interface PlanDetailContentProps {
  code: string;
}

function PlanDetailContent({ code }: PlanDetailContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const t = useTranslations("PlanDetail");
  const locale = useLocale();

  const accessToken = useAuthStore((state) => state.accessToken);

  const benefitsSectionRef = useRef<HTMLDivElement>(null);
  const benefitsTriggerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [showStickyCta, setShowStickyCta] = useState(false);
  const [selectedBenefits, setSelectedBenefits] = useState<SelectedBenefits>(
    {},
  );

  const [pendingScrollStepCode, setPendingScrollStepCode] = useState<
    string | null
  >(null);

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  // 다른 요금제로 가입이 이미 진행 중인 상태에서 이 요금제로 새로 시작하려는 경우,
  // 전환 확인을 받기 전까지 그 기존 요금제 정보를 잠깐 들고 있는 상태
  const [pendingSwitchFromPlan, setPendingSwitchFromPlan] = useState<{
    code: string;
    name: string;
  } | null>(null);

  const {
    data: plan,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["plans", code],
    queryFn: () => getPlanByCode(code),
    enabled: Boolean(code),
  });

  /*
   * 로그인한 사용자만 현재 가입 요금제를 조회함
   * 비로그인 사용자는 요금제 탐색 자체는 그대로 이용할 수 있음
   */
  const { data: currentPlan, isPending: isCurrentPlanPending } = useQuery({
    queryKey: ["plans", "me", "current"],
    queryFn: getCurrentPlan,
    enabled: Boolean(accessToken),
    retry: false,
  });

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale).format(value);

  useEffect(() => {
    if (!plan || plan.choiceBenefits.length === 0) {
      return;
    }

    const trigger = benefitsTriggerRef.current;

    if (!trigger) {
      return;
    }

    const scrollContainer = trigger.closest("main");

    if (!scrollContainer) {
      return;
    }

    const handleScroll = () => {
      const triggerTop = trigger.getBoundingClientRect().top;
      const containerRect = scrollContainer.getBoundingClientRect();

      // 혜택 선택 영역에 가까워졌을 때 하단 CTA를 띄워 선택 흐름을 끊지 않음
      const showThreshold = containerRect.top + containerRect.height * 0.6;

      setShowStickyCta(triggerTop <= showThreshold);
    };

    const frame = window.requestAnimationFrame(handleScroll);

    scrollContainer.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    window.addEventListener("resize", handleScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [plan]);

  useEffect(() => {
    if (!pendingScrollStepCode) {
      return;
    }

    // 새로 열린 의존 단계가 DOM에 반영된 다음 프레임에 스크롤해야 위치가 정확함
    const frame = window.requestAnimationFrame(() => {
      stepRefs.current[pendingScrollStepCode]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      setPendingScrollStepCode(null);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pendingScrollStepCode]);

  useEffect(() => {
    if (!isExitModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExitModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExitModalOpen]);

  if (isPending) {
    return <PageSpinner label={t("loading")} />;
  }

  if (isError || !plan) {
    return (
      <PageContainer className="py-xl">
        <ErrorState
          title={t("error")}
          retryLabel={t("retry")}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const isCurrentPlan = currentPlan?.planCode === plan.code;

  const isPlanChange =
    currentPlan !== null && currentPlan !== undefined && !isCurrentPlan;

  const isUnlimited = plan.data.amountMb === null;
  const planNumber = plan.code.replace("nerget-", "");

  const benefits =
    plan.benefitDetails.length > 0
      ? plan.benefitDetails
      : plan.perks.map((perk) => ({
          category: "other" as const,
          title: perk,
          description: null,
          monthlyValue: null,
        }));

  const sortedSteps = [...plan.choiceBenefits].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const activeSteps = getActiveSteps(sortedSteps, selectedBenefits);

  const visibleSteps = getProgressiveSteps(activeSteps, selectedBenefits);

  const requiredChoiceSteps = activeSteps.filter(
    (step) => step.stepType === "choice" && step.required,
  );

  const isJoinEnabled = requiredChoiceSteps.every((step) =>
    isStepComplete(step, selectedBenefits),
  );

  /*
   * 선택 단계가 없는 요금제는 별도 선택 과정 없이
   * 가입/변경 CTA를 처음부터 노출함
   */
  const shouldShowStickyCta = plan.choiceBenefits.length === 0 || showStickyCta;

  const selectedOptions = activeSteps.flatMap((step) => {
    if (step.stepType !== "choice") {
      return [];
    }

    const selectedCodes = selectedBenefits[step.code] ?? [];

    return selectedCodes.flatMap((optionCode) => {
      const option = step.options.find((item) => item.code === optionCode);

      if (!option) {
        return [];
      }

      return [
        {
          key: `${step.code}-${option.code}`,
          title: option.title,
          monthlyValue: option.monthlyValue,
        },
      ];
    });
  });

  const knownSelectedBenefitTotal = selectedOptions.reduce(
    (total, option) =>
      option.monthlyValue !== null ? total + option.monthlyValue : total,
    0,
  );

  const hasKnownSelectedBenefitValue = selectedOptions.some(
    (option) => option.monthlyValue !== null,
  );

  const hasUnknownSelectedBenefitValue = selectedOptions.some(
    (option) => option.monthlyValue === null,
  );

  const getSectionTitle = (step: PlanChoiceBenefit) => {
    if (step.sectionTitle === null) {
      return null;
    }

    switch (step.section) {
      case "plus":
        return t("sections.plus");

      case "premium":
      case "detail":
        return t("sections.premium");

      case "coupon":
        return step.stepType === "choice"
          ? t("sections.couponChoice")
          : t("sections.couponInfo");

      case "membership":
        return t("sections.membership");

      default:
        return step.sectionTitle;
    }
  };

  const getStepTitle = (step: PlanChoiceBenefit) => {
    switch (step.code) {
      case "plus-benefit":
        return t("steps.plusBenefit");

      case "samsung-device-detail":
        return t("steps.samsungDevice");

      case "apple-device-detail":
        return t("steps.appleDevice");

      case "mania-device-detail":
        return t("steps.maniaDevice");

      case "netflix-detail":
        return t("steps.netflix");

      case "daily-plus":
      case "daily-plus-premium":
        return t("steps.dailyPlus");

      case "nerget-coupon":
        return t("steps.nergetCoupon");

      case "vip-membership":
        return t("steps.vipMembership");

      case "addon-benefit":
        return t("steps.addonBenefit");

      case "promotion-info":
        return t("steps.promotion");

      default:
        return step.title;
    }
  };

  const getStepInstruction = (step: PlanChoiceBenefit) => {
    if (step.stepType === "choice") {
      return t("selectCount", {
        count: step.selectionCount,
      });
    }

    if (step.code === "vip-membership") {
      return t("vipInstruction");
    }

    if (step.code === "addon-benefit") {
      return t("addonInstruction");
    }

    return step.instruction;
  };

  const handleBenefitsScroll = () => {
    benefitsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSelectOption = (step: PlanChoiceBenefit, optionCode: string) => {
    const currentSelected = selectedBenefits[step.code] ?? [];

    let nextSelected: string[];

    if (step.selectionCount === 1) {
      nextSelected = [optionCode];
    } else if (currentSelected.includes(optionCode)) {
      nextSelected = currentSelected.filter(
        (selectedCode) => selectedCode !== optionCode,
      );
    } else if (currentSelected.length < step.selectionCount) {
      nextSelected = [...currentSelected, optionCode];
    } else {
      return;
    }

    const rawNextSelections: SelectedBenefits = {
      ...selectedBenefits,
      [step.code]: nextSelected,
    };

    // 이전 선택 때문에 더 이상 조건을 만족하지 않는 하위 단계 선택값을 제거함
    const sanitizedSelections = sanitizeSelections(
      sortedSteps,
      rawNextSelections,
    );

    const previousVisibleSteps = getProgressiveSteps(
      getActiveSteps(sortedSteps, selectedBenefits),
      selectedBenefits,
    );

    const nextActiveSteps = getActiveSteps(sortedSteps, sanitizedSelections);

    const nextVisibleSteps = getProgressiveSteps(
      nextActiveSteps,
      sanitizedSelections,
    );

    setSelectedBenefits(sanitizedSelections);

    if (!isStepComplete(step, sanitizedSelections)) {
      return;
    }

    const previousVisibleCodes = new Set(
      previousVisibleSteps.map((item) => item.code),
    );

    const newlyVisibleStep = nextVisibleSteps.find(
      (item) => !previousVisibleCodes.has(item.code),
    );

    if (newlyVisibleStep) {
      setPendingScrollStepCode(newlyVisibleStep.code);

      return;
    }

    const currentStepIndex = nextVisibleSteps.findIndex(
      (item) => item.code === step.code,
    );

    const nextStep = nextVisibleSteps
      .slice(currentStepIndex + 1)
      .find(
        (item) =>
          item.stepType === "info" ||
          !isStepComplete(item, sanitizedSelections),
      );

    if (nextStep) {
      setPendingScrollStepCode(nextStep.code);
    }
  };

  const handleConfirmExit = () => {
    setIsExitModalOpen(false);
    router.back();
  };

  /*
   * 이전 가입 플로우 잔여 상태를 지우고 이 요금제로 가입 플로우를 새로 시작함.
   * handleAISignup에서 다른 요금제 가입이 진행 중이지 않을 때 바로 호출되거나,
   * 전환 확인 팝업에서 사용자가 "전환하기"를 눌렀을 때 호출됨
   */
  const proceedToAISignup = () => {
    setPendingSwitchFromPlan(null);
    sessionStorage.removeItem("signupEntryShown");
    sessionStorage.removeItem("signupStep");
    sessionStorage.removeItem("signupQuickReplies");
    sessionStorage.removeItem("signupKickoffSent");
    sessionStorage.setItem(
      "preselectedPlan",
      JSON.stringify({
        code: plan.code,
        name: plan.name,
        monthlyFee: plan.monthlyFee,
        // 추천 카드(PlanRecommendationCards)를 통해 들어온 경우에만 쿼리에 붙는 값.
        // 가입 전환율 집계에서 "AI 추천 → 가입"만 구분해서 잡기 위해 필요함
        recommendedByAI: searchParams.get("recommended") === "true",
      }),
    );
    // 사용자가 선택한 혜택 타이틀을 AI 인삿말 생성에 활용
    const benefitTitles = selectedOptions.map((opt) => opt.title);
    if (benefitTitles.length > 0) {
      sessionStorage.setItem(
        "preselectedPlanBenefits",
        JSON.stringify(benefitTitles),
      );
    } else {
      sessionStorage.removeItem("preselectedPlanBenefits");
    }
    // 상세 페이지에서 이미 고른 선택형 혜택을 가입 플로우에 그대로 넘겨서,
    // AI가 select_benefits 단계에서 같은 걸 또 묻지 않게 함
    const nonEmptySelectedBenefits = Object.fromEntries(
      Object.entries(selectedBenefits).filter(([, codes]) => codes.length > 0),
    );
    if (Object.keys(nonEmptySelectedBenefits).length > 0) {
      sessionStorage.setItem(
        "signupCollectedData",
        JSON.stringify({ selectedBenefits: nonEmptySelectedBenefits }),
      );
    } else {
      sessionStorage.removeItem("signupCollectedData");
    }
    // entry 쿼리 파라미터로 매번 다른 값을 붙여, 직전에 /ai를 방문한 적이 있어
    // 페이지가 재사용되는 경우에도 preselectedPlan을 다시 읽어오도록 강제함
    router.push(`/ai?entry=${createNavigationNonce()}`);
  };

  /* AI 채팅을 통한 가입 플로우 시작 */
  const handleAISignup = () => {
    if (isCurrentPlan) return;
    if (!accessToken) {
      router.push("/login");
      return;
    }

    // 이미 다른 요금제로 가입이 진행 중인지 확인함. AI 채팅 쪽(useAIChat)의 메모리
    // 상태는 페이지 재마운트 여부에 따라 믿을 수 없어서, 여기서 sessionStorage를
    // 직접(잔여 상태를 지우기 전에!) 확인하는 게 유일하게 확실한 시점임
    try {
      const existingStep = sessionStorage.getItem("signupStep");
      const existingPlanRaw = sessionStorage.getItem("preselectedPlan");
      if (existingStep && existingPlanRaw) {
        const existingPlan = JSON.parse(existingPlanRaw) as {
          code: string;
          name: string;
        };
        if (existingPlan.code && existingPlan.code !== plan.code) {
          setPendingSwitchFromPlan(existingPlan);
          return;
        }
      }
    } catch {
      /* noop */
    }

    proceedToAISignup();
  };

  return (
    <>
      {/* 채팅으로 돌아가기 버튼은 하단 CTA 표시 여부(스크롤)와 무관하게
          항상 같은 자리에 떠 있어야 하는 독립적인 요소라 여기서 별도로 그림 */}
      <BackToChatButton />

      <PageContainer className="pb-xl pt-md">
        <div className="flex flex-col gap-lg">
          <button
            type="button"
            onClick={() => setIsExitModalOpen(true)}
            aria-label={t("back")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-surface"
          >
            <ArrowLeft aria-hidden="true" size={21} />
          </button>

          <section className="flex items-center justify-between gap-lg">
            <div className="min-w-0">
              {plan.promotion.maxMonthlyBenefit !== null && (
                <p className="font-sans text-micro-11-regular text-text-secondary">
                  {t("maxBenefit", {
                    amount: formatNumber(plan.promotion.maxMonthlyBenefit),
                  })}
                </p>
              )}

              {plan.promotion.effectiveMonthlyFee !== null && (
                <p className="mt-xs font-sans text-caption-13-medium text-text-primary">
                  <span className="font-sans text-label-14-bold text-action-primary">
                    {t("effectivePrice")}{" "}
                  </span>

                  <strong className="font-sans text-title-24-bold text-text-primary">
                    {formatNumber(plan.promotion.effectiveMonthlyFee)}
                  </strong>

                  <span className="ml-xs">{t("wonPerMonth")}</span>
                </p>
              )}

              <p
                className={
                  plan.promotion.effectiveMonthlyFee !== null
                    ? "mt-xs font-sans text-micro-11-regular text-text-primary line-through"
                    : "font-sans text-title-20-bold text-text-primary"
                }
              >
                {formatNumber(plan.monthlyFee)}
                <span
                  className={
                    plan.promotion.effectiveMonthlyFee === null
                      ? "ml-xs font-sans text-caption-13-medium"
                      : undefined
                  }
                >
                  {t("wonPerMonth")}
                </span>
              </p>
            </div>

            <NergetPlanBadge number={planNumber} size="sm" />

            <h1 className="sr-only">{plan.name}</h1>
          </section>

          <section className="overflow-hidden rounded-lg bg-surface">
            <div className="grid grid-cols-3">
              <PlanUsageItem
                icon={<Database size={19} />}
                value={isUnlimited ? t("unlimited") : plan.data.display}
                label={t("data")}
                wrap
              />

              <PlanUsageItem
                icon={<Phone size={19} />}
                value={plan.voice}
                label={t("voice")}
                bordered
              />

              <PlanUsageItem
                icon={<MessageSquare size={19} />}
                value={plan.sms}
                label={t("sms")}
              />
            </div>

            <div className="px-lg pb-md">
              <div className="flex flex-col gap-sm">
                {plan.data.sharingDisplay && (
                  <CompactInfo
                    label={t("tethering")}
                    value={plan.data.sharingDisplay}
                  />
                )}

                {plan.additionalVoice && (
                  <CompactInfo
                    label={t("additionalVoice")}
                    value={plan.additionalVoice}
                  />
                )}

                {plan.data.familyDataDisplay && (
                  <CompactInfo
                    label={t("familyData")}
                    value={plan.data.familyDataDisplay}
                  />
                )}
              </div>
            </div>

            {benefits.length > 0 && (
              <div className="mx-lg border-t border-border-default py-md">
                <ul className="flex flex-col gap-sm">
                  {benefits.map((benefit) => (
                    <li
                      key={`${benefit.category}-${benefit.title}`}
                      className="flex items-start gap-sm"
                    >
                      <span
                        aria-hidden="true"
                        className="w-[4px] shrink-0 font-sans text-micro-11-regular leading-relaxed text-text-secondary"
                      >
                        ·
                      </span>

                      <span className="min-w-0 flex-1 font-sans text-micro-11-regular leading-relaxed text-text-secondary">
                        {benefit.title}

                        {benefit.monthlyValue !== null && (
                          <span className="ml-xs text-action-primary">
                            {t("upTo", {
                              amount: formatNumber(benefit.monthlyValue),
                            })}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {sortedSteps.length > 0 && (
            <button
              type="button"
              onClick={handleBenefitsScroll}
              className="flex w-full items-center justify-center gap-xs py-sm text-text-secondary"
            >
              <ChevronDown aria-hidden="true" size={17} />

              <span className="font-sans text-caption-13-medium">
                {t("goToBenefits")}
              </span>
            </button>
          )}
        </div>
      </PageContainer>

      <div
        ref={benefitsTriggerRef}
        aria-hidden="true"
        className="h-px w-full"
      />

      {sortedSteps.length > 0 && (
        <div
          ref={benefitsSectionRef}
          className="scroll-mt-lg bg-surface pb-2xl"
        >
          <PageContainer>
            <div className="flex flex-col">
              {visibleSteps.map((step, index) => {
                const previousStep = visibleSteps[index - 1];

                const sectionTitle = getSectionTitle(step);

                const previousSectionTitle = previousStep
                  ? getSectionTitle(previousStep)
                  : null;

                const shouldShowSectionTitle =
                  sectionTitle !== null &&
                  sectionTitle !== previousSectionTitle;

                return (
                  <div
                    key={step.code}
                    ref={(element) => {
                      stepRefs.current[step.code] = element;
                    }}
                    className={`scroll-mt-lg ${
                      index === 0 ? "pt-2xl" : "pt-3xl"
                    }`}
                  >
                    {shouldShowSectionTitle && (
                      <h2 className="mb-2xl font-sans text-title-24-bold leading-snug text-text-primary">
                        {sectionTitle}
                      </h2>
                    )}

                    {step.stepType === "choice" ? (
                      <ChoiceStep
                        step={step}
                        title={getStepTitle(step)}
                        instruction={getStepInstruction(step) ?? undefined}
                        selectedCodes={selectedBenefits[step.code] ?? []}
                        disabled={
                          isCurrentPlan ||
                          (Boolean(accessToken) && isCurrentPlanPending)
                        }
                        onSelect={(optionCode) =>
                          handleSelectOption(step, optionCode)
                        }
                        formatNumber={formatNumber}
                        monthlyValueLabel={(amount) =>
                          t("monthlyValue", {
                            amount,
                          })
                        }
                      />
                    ) : (
                      <InfoStep
                        step={step}
                        title={getStepTitle(step)}
                        instruction={getStepInstruction(step) ?? undefined}
                        formatNumber={formatNumber}
                        monthlyValueLabel={(amount) =>
                          step.code === "addon-benefit"
                            ? t("discountAmount", {
                                amount,
                              })
                            : t("monthlyValue", {
                                amount,
                              })
                        }
                      />
                    )}
                  </div>
                );
              })}

              <div aria-hidden="true" className="h-[260px]" />
            </div>
          </PageContainer>
        </div>
      )}

      {shouldShowStickyCta && (
        <div className="fixed bottom-[72px] left-1/2 z-20 w-full max-w-[446px] -translate-x-1/2 rounded-t-[20px] bg-surface shadow-[0_-8px_28px_rgb(18_20_31_/_12%)]">
          <div className="px-lg pb-lg pt-lg">
            {selectedOptions.length > 0 && (
              <div className="mb-lg">
                <p className="mb-sm font-sans text-caption-13-medium text-text-secondary">
                  {t("selectedBenefitAmount")}
                </p>

                <div className="flex items-center justify-between gap-md">
                  <div className="flex min-w-0 items-center gap-xs overflow-hidden">
                    {selectedOptions.slice(0, 3).map((item) => (
                      <span
                        key={item.key}
                        className="max-w-[92px] truncate rounded-full bg-surface-subtle px-sm py-xs font-sans text-micro-11-bold text-text-secondary"
                      >
                        {item.title}
                      </span>
                    ))}
                  </div>

                  <strong className="shrink-0 font-sans text-label-14-bold text-text-secondary">
                    {hasKnownSelectedBenefitValue ? (
                      <>
                        {formatNumber(knownSelectedBenefitTotal)}
                        {t("wonPerMonth")}
                        {hasUnknownSelectedBenefitValue && "+"}
                      </>
                    ) : (
                      t("benefitValueUnknown")
                    )}
                  </strong>
                </div>
              </div>
            )}

            <div className="mb-xl flex items-center justify-between gap-lg">
              <span className="font-sans text-title-18-bold text-text-primary">
                {t("estimatedPayment")}
              </span>

              <strong className="shrink-0 font-sans text-title-18-bold text-text-primary">
                {formatNumber(plan.monthlyFee)}
                {t("wonPerMonth")}
              </strong>
            </div>

            <Button
              className="h-[56px] w-full rounded-xl"
              disabled={
                !isJoinEnabled ||
                isCurrentPlan ||
                (Boolean(accessToken) && isCurrentPlanPending)
              }
              onClick={handleAISignup}
            >
              {Boolean(accessToken) && isCurrentPlanPending
                ? t("loading")
                : isCurrentPlan
                  ? t("currentPlan")
                  : isPlanChange
                    ? "AI와 요금제 변경하기"
                    : "AI와 가입하기"}
            </Button>
          </div>
        </div>
      )}

      {isExitModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-lg"
          onMouseDown={() => setIsExitModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-plan-title"
            className="w-full max-w-[320px] rounded-xl bg-surface p-lg shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2
              id="exit-plan-title"
              className="font-sans text-title-18-bold leading-relaxed text-text-primary"
            >
              {t("exitModal.title")}
            </h2>

            <p className="mt-xs font-sans text-label-14-medium text-text-primary">
              {t("exitModal.description")}
            </p>

            <div className="mt-xl grid grid-cols-2 gap-sm">
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                className="h-[52px] rounded-lg bg-surface-subtle font-sans text-label-14-bold text-text-primary"
              >
                {t("exitModal.cancel")}
              </button>

              <button
                type="button"
                onClick={handleConfirmExit}
                className="h-[52px] rounded-lg bg-action-primary font-sans text-label-14-bold text-text-on-primary"
              >
                {t("exitModal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingSwitchFromPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-lg"
          onMouseDown={() => setPendingSwitchFromPlan(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="switch-plan-title"
            className="w-full max-w-[320px] rounded-xl bg-surface p-lg shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2
              id="switch-plan-title"
              className="font-sans text-title-18-bold leading-relaxed text-text-primary"
            >
              {t("switchPlanModal.title")}
            </h2>

            <p className="mt-xs font-sans text-label-14-medium text-text-primary">
              {t("switchPlanModal.description", {
                from: pendingSwitchFromPlan.name,
                to: plan.name,
              })}
            </p>

            <div className="mt-xl grid grid-cols-2 gap-sm">
              <button
                type="button"
                onClick={() => setPendingSwitchFromPlan(null)}
                className="h-[52px] rounded-lg bg-surface-subtle font-sans text-label-14-bold text-text-primary"
              >
                {t("switchPlanModal.cancel")}
              </button>

              <button
                type="button"
                onClick={proceedToAISignup}
                className="h-[52px] rounded-lg bg-action-primary font-sans text-label-14-bold text-text-on-primary"
              >
                {t("switchPlanModal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
