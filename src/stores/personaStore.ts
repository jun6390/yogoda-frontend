import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { PersonaAnalysisResult } from "@/types/persona";

export interface PersonaAnswers {
  usageType?: string;
  monthlyData?: string;
  contentPreference?: string;
  benefitPreference?: string;
  planPriority?: string;
  recommendationPriority?: string;
}

interface PersonaState {
  answers: PersonaAnswers;
  analysisResult: PersonaAnalysisResult | null;
  isSkipped: boolean;

  setAnswer: (key: keyof PersonaAnswers, value: string) => void;

  setAnalysisResult: (result: PersonaAnalysisResult) => void;

  skipPersona: () => void;
  resetPersona: () => void;
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set) => ({
      answers: {},
      analysisResult: null,
      isSkipped: false,

      // 질문별 답변을 의미 있는 key 기준으로 저장함
      setAnswer: (key, value) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [key]: value,
          },
          /*
           * 설문 답변이 변경되면 이전 AI 분석 결과는
           * 현재 답변과 맞지 않을 수 있으므로 초기화함
           */
          analysisResult: null,
          isSkipped: false,
        })),

      // AI가 설문 답변을 분석한 최종 결과를 저장함
      setAnalysisResult: (result) =>
        set({
          analysisResult: result,
        }),

      // 설문을 건너뛴 사용자를 구분하고 기존 답변을 초기화함
      skipPersona: () =>
        set({
          answers: {},
          analysisResult: null,
          isSkipped: true,
        }),

      // 페르소나 설문을 다시 시작할 때 기존 상태를 초기화함
      resetPersona: () =>
        set({
          answers: {},
          analysisResult: null,
          isSkipped: false,
        }),
    }),
    {
      /*
       * 로그인 전 설문 결과도 페이지 이동 및 새로고침 후 유지할 수 있도록
       * localStorage에 임시 저장함
       */
      name: "yogoda-persona",
    },
  ),
);
