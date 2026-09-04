import type { PlanChoiceBenefit, SelectedPlanOptions } from "@/types/plan";
type SelectedBenefits = SelectedPlanOptions;

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

export function isStepComplete(
  step: PlanChoiceBenefit,
  selectedBenefits: SelectedBenefits,
) {
  if (step.stepType === "info") {
    return true;
  }

  return (selectedBenefits[step.code]?.length ?? 0) >= step.selectionCount;
}

export function getActiveSteps(
  steps: PlanChoiceBenefit[],
  selectedBenefits: SelectedBenefits,
) {
  return steps.filter((step) => isStepEligible(step, selectedBenefits));
}

export function getProgressiveSteps(
  activeSteps: PlanChoiceBenefit[],
  selectedBenefits: SelectedBenefits,
) {
  const visibleSteps: PlanChoiceBenefit[] = [];

  // 아직 완료되지 않은 선택 단계 이후는 숨겨서 단계형 가입 흐름을 유지함
  for (const step of activeSteps) {
    visibleSteps.push(step);

    if (step.stepType === "choice" && !isStepComplete(step, selectedBenefits)) {
      break;
    }
  }

  return visibleSteps;
}

export function sanitizeSelections(
  steps: PlanChoiceBenefit[],
  selectedBenefits: SelectedBenefits,
) {
  const sanitized: SelectedBenefits = {};

  // 앞 단계부터 다시 검증해야 의존성이 끊긴 선택값이 다음 단계에 남지 않음
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
