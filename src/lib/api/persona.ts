import type { PersonaAnswers } from "@/stores/personaStore";
import type {
  PersonaAnalysisResult,
  PersonaAnalysisType,
} from "@/types/persona";

type PersonaAnalysisTemplate = Omit<PersonaAnalysisResult, "scores" | "type">;

const analysisTemplates: Record<PersonaAnalysisType, PersonaAnalysisTemplate> =
  {
    data_heavy: {
      title: "데이터 헤비형",
      description:
        "데이터 사용량이 많고 넉넉한 데이터 제공량을 중요하게 생각하는 유형이에요.",
      summary: "데이터 중심 / 사용량 넉넉하게",
      direction: "충분한 데이터 + 합리적인 요금",
      directionDescription:
        "현재 사용량을 충분히 커버하면서 불필요하게 비싼 요금제는 피하는 방향이에요.",
    },
    content_balanced: {
      title: "콘텐츠 밸런스형",
      description:
        "영상과 OTT를 자주 이용하면서도 가격과 데이터의 균형을 중요하게 생각하는 유형이에요.",
      summary: "영상 · OTT 중심 / 가격도 중요",
      direction: "80GB 전후 + OTT 선택 혜택",
      directionDescription:
        "무제한 요금제보다 비용 효율이 높고 현재 사용량도 충분히 커버할 수 있는 방향이에요.",
    },
    benefit_focused: {
      title: "혜택 알뜰형",
      description:
        "멤버십과 제휴 할인 등 통신사 혜택을 적극적으로 활용하는 유형이에요.",
      summary: "멤버십 · 쿠폰 중심 / 혜택 활용",
      direction: "실생활 혜택 + 적절한 데이터",
      directionDescription:
        "자주 이용하는 멤버십과 제휴 혜택을 최대한 활용할 수 있는 방향이에요.",
    },
    saving_focused: {
      title: "실속 절약형",
      description:
        "필요한 만큼의 데이터는 확보하면서 월 통신비를 줄이는 것을 중요하게 생각하는 유형이에요.",
      summary: "가격 중심 / 필요한 만큼만",
      direction: "필요한 데이터 + 낮은 월 요금",
      directionDescription:
        "사용하지 않는 데이터와 혜택은 줄이고 실제 사용량에 맞춘 경제적인 방향이에요.",
    },
    balanced: {
      title: "균형 추천형",
      description:
        "데이터, 혜택, 가격 중 한쪽에 치우치지 않고 전체적인 균형을 중요하게 생각하는 유형이에요.",
      summary: "데이터 · 혜택 · 가격의 균형",
      direction: "충분한 데이터 + 실속 있는 혜택",
      directionDescription:
        "가격, 데이터, 혜택을 종합해서 현재 사용 패턴에 균형 잡힌 방향이에요.",
    },
  };

function resolveAnalysisType(answers: PersonaAnswers): PersonaAnalysisType {
  if (
    answers.recommendationPriority === "cheap" ||
    answers.planPriority === "price" ||
    answers.usageType === "saving"
  ) {
    return "saving_focused";
  }

  if (
    answers.recommendationPriority === "benefit" ||
    answers.planPriority === "benefits" ||
    answers.benefitPreference === "membership" ||
    answers.benefitPreference === "coupon"
  ) {
    return "benefit_focused";
  }

  if (
    answers.contentPreference === "ott" ||
    answers.contentPreference === "video"
  ) {
    return "content_balanced";
  }

  if (
    answers.recommendationPriority === "data" ||
    answers.planPriority === "premium" ||
    answers.usageType === "data" ||
    answers.monthlyData === "unlimited"
  ) {
    return "data_heavy";
  }

  return "balanced";
}

function buildScores(answers: PersonaAnswers): PersonaAnalysisResult["scores"] {
  return {
    data:
      answers.monthlyData === "unlimited" ||
      answers.recommendationPriority === "data"
        ? 92
        : answers.usageType === "data"
          ? 84
          : 72,
    content:
      answers.contentPreference === "ott" ||
      answers.contentPreference === "video"
        ? 92
        : answers.usageType === "content"
          ? 84
          : 64,
    benefit:
      answers.recommendationPriority === "benefit" ||
      answers.planPriority === "benefits" ||
      answers.benefitPreference === "membership" ||
      answers.benefitPreference === "coupon"
        ? 88
        : 68,
    price:
      answers.recommendationPriority === "cheap" ||
      answers.planPriority === "price" ||
      answers.usageType === "saving"
        ? 90
        : 76,
  };
}

/*
 * 백엔드 AI 분석 API가 준비되기 전까지
 * Persona 결과 화면 개발을 위해 임시 분석 결과를 반환함
 *
 * 실제 API가 준비되면 이 함수 내부만 fetch 호출로 교체하면 됨
 */
export async function analyzePersona(
  answers: PersonaAnswers,
): Promise<PersonaAnalysisResult> {
  // 실제 API 호출과 비슷한 사용자 경험을 확인하기 위한 임시 지연
  await new Promise((resolve) => setTimeout(resolve, 800));

  const type = resolveAnalysisType(answers);
  const template = analysisTemplates[type];

  return {
    type,
    ...template,
    scores: buildScores(answers),
  };
}
