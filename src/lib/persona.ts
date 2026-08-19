import type { PersonaAnswers } from "@/stores/personaStore";

export interface PersonaScores {
  data: number;
  content: number;
  benefit: number;
  price: number;
}

export type PersonaType =
  "data" | "content" | "benefit" | "saving" | "balanced";

export interface PersonaResult {
  type: PersonaType;
  scores: PersonaScores;
}

/*
 * 페르소나 설문 답변을 사용 성향별 점수로 변환함
 * 각 점수는 최종적으로 0~100 범위로 제한함
 */
export function calculatePersonaScores(answers: PersonaAnswers): PersonaScores {
  let data = 50;
  let content = 50;
  let benefit = 50;
  let price = 50;

  switch (answers.usageType) {
    case "data":
      data += 25;
      content += 10;
      break;

    case "benefit":
      benefit += 25;
      break;

    case "saving":
      price += 25;
      break;

    case "ai":
      data += 5;
      content += 5;
      benefit += 5;
      price += 5;
      break;
  }

  switch (answers.monthlyData) {
    case "light":
      data -= 20;
      break;

    case "normal":
      data += 5;
      break;

    case "heavy":
      data += 25;
      break;

    case "unlimited":
      data += 35;
      break;
  }

  switch (answers.contentPreference) {
    case "video":
      content += 30;
      data += 10;
      break;

    case "sns":
      content += 20;
      data += 5;
      break;

    case "game":
      content += 25;
      data += 10;
      break;

    case "basic":
      content -= 15;
      break;
  }

  switch (answers.benefitPreference) {
    case "membership":
      benefit += 30;
      break;

    case "ott":
      benefit += 20;
      content += 15;
      break;

    case "coupon":
      benefit += 25;
      break;

    case "none":
      benefit -= 20;
      break;
  }

  switch (answers.planPriority) {
    case "price":
      price += 30;
      break;

    case "balance":
      price += 15;
      data += 5;
      break;

    case "benefits":
      benefit += 25;
      price -= 5;
      break;

    case "premium":
      data += 15;
      benefit += 10;
      price -= 20;
      break;
  }

  switch (answers.recommendationPriority) {
    case "cheap":
      price += 20;
      break;

    case "data":
      data += 20;
      break;

    case "benefit":
      benefit += 20;
      break;

    case "balanced":
      data += 5;
      content += 5;
      benefit += 5;
      price += 5;
      break;
  }

  const normalize = (score: number) => Math.max(0, Math.min(100, score));

  return {
    data: normalize(data),
    content: normalize(content),
    benefit: normalize(benefit),
    price: normalize(price),
  };
}

/*
 * 가장 강한 사용 성향을 기준으로 페르소나 유형을 결정함
 * 상위 점수들이 비슷하면 한쪽으로 단정하지 않고 밸런스형으로 분류함
 */
export function getPersonaResult(answers: PersonaAnswers): PersonaResult {
  const scores = calculatePersonaScores(answers);

  const sortedScores = Object.entries(scores).sort(
    ([, firstScore], [, secondScore]) => secondScore - firstScore,
  ) as [keyof PersonaScores, number][];

  const [first, second] = sortedScores;

  if (!first || !second) {
    return {
      type: "balanced",
      scores,
    };
  }

  const [highestType, highestScore] = first;
  const [, secondScore] = second;

  if (highestScore - secondScore <= 10) {
    return {
      type: "balanced",
      scores,
    };
  }

  const typeMap: Record<keyof PersonaScores, PersonaType> = {
    data: "data",
    content: "content",
    benefit: "benefit",
    price: "saving",
  };

  return {
    type: typeMap[highestType],
    scores,
  };
}
