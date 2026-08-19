"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Database,
  MessageSquare,
  Phone,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { NergetPlanBadge } from "@/components/plans/NergetPlanBadge";
import { Button } from "@/components/ui/Button/Button";
import { getPlanByCode } from "@/lib/api/plan";
import type { PlanChoiceBenefit, PlanChoiceBenefitOption } from "@/types/plan";

type SelectedBenefits = Record<string, string[]>;

export default function PlanDetailPage() {
  const { code } = useParams<{ code: string }>();

  return <PlanDetailContent key={code} code={code} />;
}

interface PlanDetailContentProps {
  code: string;
}

function PlanDetailContent({ code }: PlanDetailContentProps) {
  const router = useRouter();

  const t = useTranslations("PlanDetail");
  const locale = useLocale();

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

  const {
    data: plan,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["plans", code],
    queryFn: () => getPlanByCode(code),
    enabled: Boolean(code),
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
    return (
      <PageContainer className="py-xl">
        <p className="text-caption-13-medium text-text-secondary">
          {t("loading")}
        </p>
      </PageContainer>
    );
  }

  if (isError || !plan) {
    return (
      <PageContainer className="py-xl">
        <p className="text-caption-13-medium text-text-secondary">
          {t("error")}
        </p>
      </PageContainer>
    );
  }

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

  // 선택 단계가 없는 요금제는 가입 CTA를 처음부터 바로 노출
  const shouldShowStickyCta = plan.choiceBenefits.length === 0 || showStickyCta;

  const selectedOptionSummaries = activeSteps.flatMap((step) => {
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
        },
      ];
    });
  });

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

  return (
    <>
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

              <p className="mt-xs font-sans text-micro-11-regular text-text-primary line-through">
                {formatNumber(plan.monthlyFee)}
                {t("wonPerMonth")}
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
                          t("monthlyValue", {
                            amount,
                          })
                        }
                      />
                    )}
                  </div>
                );
              })}

              <div aria-hidden="true" className="h-[180px]" />
            </div>
          </PageContainer>
        </div>
      )}

      {shouldShowStickyCta && (
        <div className="fixed bottom-[72px] left-1/2 z-20 w-[calc(100%-2px)] max-w-[446px] -translate-x-1/2 border-t border-border-default bg-surface shadow-[0_-8px_24px_rgb(18_20_31_/_8%)]">
          <PageContainer className="pb-md pt-md">
            {selectedOptionSummaries.length > 0 && (
              <div className="mb-md">
                <p className="mb-sm font-sans text-micro-11-regular text-text-secondary">
                  {t("selectedBenefits")}
                </p>

                <div className="flex gap-xs overflow-x-auto">
                  {selectedOptionSummaries.map((item) => (
                    <span
                      key={item.key}
                      className="shrink-0 rounded-full bg-surface-subtle px-sm py-xs font-sans text-micro-11-bold text-text-secondary"
                    >
                      {item.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-md flex items-center justify-between gap-lg">
              <span className="font-sans text-label-14-bold text-text-primary">
                {t("estimatedPayment")}
              </span>

              <strong className="font-sans text-label-14-bold text-text-primary">
                {formatNumber(plan.monthlyFee)}
                {t("wonPerMonth")}
              </strong>
            </div>

            <Button className="w-full" disabled={!isJoinEnabled}>
              {t("join")}
            </Button>
          </PageContainer>
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
                className="h-[52px] rounded-lg bg-action-primary font-sans text-label-14-bold text-white"
              >
                {t("exitModal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ChoiceStepProps {
  step: PlanChoiceBenefit;
  title: string;
  instruction?: string;
  selectedCodes: string[];
  onSelect: (optionCode: string) => void;
  formatNumber: (value: number) => string;
  monthlyValueLabel: (amount: string) => string;
}

function ChoiceStep({
  step,
  title,
  instruction,
  selectedCodes,
  onSelect,
  formatNumber,
  monthlyValueLabel,
}: ChoiceStepProps) {
  return (
    <section>
      <div className="flex items-end justify-between gap-md">
        <div>
          <h3 className="font-sans text-label-14-bold text-text-primary">
            {title}
          </h3>

          {instruction && (
            <p className="mt-xs font-sans text-caption-13-medium text-text-secondary">
              {instruction}
            </p>
          )}
        </div>

        <span className="shrink-0 font-sans text-micro-11-regular text-text-secondary">
          {selectedCodes.length}/{step.selectionCount}
        </span>
      </div>

      <div className="mt-md grid grid-cols-2 gap-sm">
        {step.options.map((option) => {
          const isSelected = selectedCodes.includes(option.code);

          const selectionLimitReached =
            step.selectionCount > 1 &&
            selectedCodes.length >= step.selectionCount &&
            !isSelected;

          return (
            <button
              key={option.code}
              type="button"
              disabled={selectionLimitReached}
              aria-pressed={isSelected}
              onClick={() => onSelect(option.code)}
              className={`min-h-[104px] rounded-lg border p-md text-left transition-colors ${
                isSelected
                  ? "border-action-primary bg-surface"
                  : "border-border-default bg-surface"
              } ${
                selectionLimitReached ? "cursor-not-allowed opacity-40" : ""
              }`}
            >
              <BenefitOptionContent
                option={option}
                selected={isSelected}
                formatNumber={formatNumber}
                monthlyValueLabel={monthlyValueLabel}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface InfoStepProps {
  step: PlanChoiceBenefit;
  title: string;
  instruction?: string;
  formatNumber: (value: number) => string;
  monthlyValueLabel: (amount: string) => string;
}

function InfoStep({
  step,
  title,
  instruction,
  formatNumber,
  monthlyValueLabel,
}: InfoStepProps) {
  return (
    <section>
      <h3 className="font-sans text-label-14-bold text-text-primary">
        {title}
      </h3>

      {instruction && (
        <p className="mt-xs font-sans text-caption-13-medium text-text-secondary">
          {instruction}
        </p>
      )}

      <div className="mt-md flex flex-col gap-sm">
        {step.options.map((option) => (
          <div
            key={option.code}
            className="rounded-lg border border-border-default bg-surface p-lg"
          >
            <BenefitOptionContent
              option={option}
              formatNumber={formatNumber}
              monthlyValueLabel={monthlyValueLabel}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

interface BenefitOptionContentProps {
  option: PlanChoiceBenefitOption;
  selected?: boolean;
  formatNumber: (value: number) => string;
  monthlyValueLabel: (amount: string) => string;
}

function BenefitOptionContent({
  option,
  selected = false,
  formatNumber,
  monthlyValueLabel,
}: BenefitOptionContentProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-sm">
        <div className="min-w-0">
          {option.brand && (
            <p className="mb-xs font-sans text-micro-11-regular text-text-secondary">
              {option.brand}
            </p>
          )}

          <p
            className={`font-sans text-caption-13-bold ${
              selected ? "text-action-primary" : "text-text-primary"
            }`}
          >
            {option.title}
          </p>
        </div>

        {selected && (
          <Check
            aria-hidden="true"
            size={17}
            className="shrink-0 text-action-primary"
          />
        )}
      </div>

      {option.description && (
        <p className="mt-sm font-sans text-micro-11-regular leading-relaxed text-text-secondary">
          {option.description}
        </p>
      )}

      {option.monthlyValue !== null && (
        <p className="mt-sm font-sans text-micro-11-bold text-text-primary">
          {monthlyValueLabel(formatNumber(option.monthlyValue))}
        </p>
      )}
    </>
  );
}

function isDependencySatisfied(
  dependency: PlanChoiceBenefit["dependsOn"][number],
  selectedBenefits: SelectedBenefits,
) {
  const selectedCodes = selectedBenefits[dependency.stepCode] ?? [];

  if (dependency.match === "all") {
    return dependency.optionCodes.every((optionCode) =>
      selectedCodes.includes(optionCode),
    );
  }

  return dependency.optionCodes.some((optionCode) =>
    selectedCodes.includes(optionCode),
  );
}

function isStepEligible(
  step: PlanChoiceBenefit,
  selectedBenefits: SelectedBenefits,
) {
  if (step.dependsOn.length === 0) {
    return true;
  }

  return step.dependsOn.every((dependency) =>
    isDependencySatisfied(dependency, selectedBenefits),
  );
}

function isStepComplete(
  step: PlanChoiceBenefit,
  selectedBenefits: SelectedBenefits,
) {
  if (step.stepType === "info") {
    return true;
  }

  return (selectedBenefits[step.code]?.length ?? 0) >= step.selectionCount;
}

function getActiveSteps(
  steps: PlanChoiceBenefit[],
  selectedBenefits: SelectedBenefits,
) {
  return steps.filter((step) => isStepEligible(step, selectedBenefits));
}

function getProgressiveSteps(
  activeSteps: PlanChoiceBenefit[],
  selectedBenefits: SelectedBenefits,
) {
  const visibleSteps: PlanChoiceBenefit[] = [];

  for (const step of activeSteps) {
    visibleSteps.push(step);

    if (step.stepType === "choice" && !isStepComplete(step, selectedBenefits)) {
      break;
    }
  }

  return visibleSteps;
}

function sanitizeSelections(
  steps: PlanChoiceBenefit[],
  selectedBenefits: SelectedBenefits,
) {
  const sanitized: SelectedBenefits = {};

  for (const step of steps) {
    if (step.stepType !== "choice") {
      continue;
    }

    if (!isStepEligible(step, sanitized)) {
      continue;
    }

    const validOptionCodes = new Set(step.options.map((option) => option.code));

    const validSelections = (selectedBenefits[step.code] ?? [])
      .filter((optionCode) => validOptionCodes.has(optionCode))
      .slice(0, step.selectionCount);

    if (validSelections.length > 0) {
      sanitized[step.code] = validSelections;
    }
  }

  return sanitized;
}

interface PlanUsageItemProps {
  icon: ReactNode;
  value: string;
  label: string;
  bordered?: boolean;
  wrap?: boolean;
}

function PlanUsageItem({
  icon,
  value,
  label,
  bordered = false,
  wrap = false,
}: PlanUsageItemProps) {
  return (
    <div
      className={`relative flex min-w-0 flex-col items-center px-xs py-lg text-center ${
        bordered
          ? "before:absolute before:left-0 before:top-1/2 before:h-[56px] before:-translate-y-1/2 before:border-l before:border-border-default after:absolute after:right-0 after:top-1/2 after:h-[56px] after:-translate-y-1/2 after:border-r after:border-border-default"
          : ""
      }`}
    >
      <span className="text-action-primary">{icon}</span>

      <p
        className={`mt-sm max-w-full text-center font-sans text-caption-13-bold text-text-primary ${
          wrap ? "whitespace-normal break-keep leading-snug" : "truncate"
        }`}
      >
        {value}
      </p>

      <span className="mt-xs font-sans text-micro-11-regular text-text-secondary">
        {label}
      </span>
    </div>
  );
}

interface CompactInfoProps {
  label: string;
  value: string;
}

function CompactInfo({ label, value }: CompactInfoProps) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-lg">
      <span className="shrink-0 font-sans text-micro-11-regular text-text-secondary">
        {label}
      </span>

      <span className="text-right font-sans text-micro-11-bold text-text-primary">
        {value}
      </span>
    </div>
  );
}
