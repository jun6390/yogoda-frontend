import type { PersonaAnswers } from "@/stores/personaStore";
import type { PersonaAnalysisResult } from "@/types/persona";

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

  return {
    type: "content_balanced",
    title: "콘텐츠 밸런스형",
    description:
      "영상과 OTT를 자주 이용하면서도 가격과 데이터의 균형을 중요하게 생각하는 유형이에요.",
    summary: "영상 · OTT 중심 / 가격도 중요",
    scores: {
      data: 84,
      content: 92,
      benefit: 68,
      price: 76,
    },
    direction: "80GB 전후 + OTT 선택 혜택",
    directionDescription:
      "무제한 요금제보다 비용 효율이 높고 현재 사용량도 충분히 커버할 수 있는 방향이에요.",
  };
}
