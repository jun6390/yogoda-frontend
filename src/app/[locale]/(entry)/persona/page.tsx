"use client";

import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button/Button";
import { useRouter } from "@/i18n/navigation";
import { analyzePersona } from "@/lib/api/persona";
import { completeOnboarding } from "@/lib/onboarding";
import { type PersonaAnswers, usePersonaStore } from "@/stores/personaStore";

interface PersonaOption {
  value: string;
  title: string;
  description: string;
}

interface PersonaQuestion {
  title: string;
  description: string;
  options: PersonaOption[];
}

/*
 * 각 설문 단계와 AI 추천에 전달할 페르소나 key를 연결함
 * 질문 순서가 바뀌더라도 답변의 의미가 명확하게 유지됨
 */
const PERSONA_KEYS = [
  "usageType",
  "monthlyData",
  "contentPreference",
  "benefitPreference",
  "planPriority",
  "recommendationPriority",
] as const satisfies readonly (keyof PersonaAnswers)[];

export default function PersonaPage() {
  const t = useTranslations("Persona");
  const router = useRouter();

  /*
   * 질문과 선택지 문구는 locale에 따라 messages의 Persona.questions에서 가져옴
   * ko/en에서 동일한 데이터 구조를 사용함
   */
  const questions = t.raw("questions") as PersonaQuestion[];
  const totalSteps = questions.length;

  // 현재 보여주고 있는 질문의 index를 관리함
  const [currentStep, setCurrentStep] = useState(0);

  // AI 분석 API 호출 중 중복 요청을 막고 버튼 로딩 상태를 표시함
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /*
   * 설문 답변은 페이지 로컬 state가 아닌 Zustand store에 저장함
   * 페이지 이동 및 새로고침 후에도 답변을 유지할 수 있음
   */
  const answers = usePersonaStore((state) => state.answers);
  const setAnswer = usePersonaStore((state) => state.setAnswer);
  const setAnalysisResult = usePersonaStore((state) => state.setAnalysisResult);
  const skipPersona = usePersonaStore((state) => state.skipPersona);

  const currentQuestion = questions[currentStep];
  const currentKey = PERSONA_KEYS[currentStep];
  const selectedValue = answers[currentKey];

  // 현재 질문의 선택값을 의미 있는 key 기준으로 저장함
  const handleSelect = (value: string) => {
    setAnswer(currentKey, value);
  };

  /*
   * 첫 번째 질문에서 뒤로가기를 누르면 이전 페이지로 이동하고,
   * 그 외 질문에서는 이전 질문으로 이동함
   */
  const handleBack = () => {
    if (currentStep === 0) {
      router.back();
      return;
    }

    setCurrentStep((current) => current - 1);
  };

  /*
   * 선택하지 않은 상태에서는 다음 단계로 이동하지 않음
   * 마지막 질문 전까지는 다음 질문으로 이동하고,
   * 마지막 질문에서는 AI가 설문 답변을 분석한 뒤 결과 화면으로 이동함
   */
  const handleNext = async () => {
    if (!selectedValue || isAnalyzing) {
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep((current) => current + 1);
      return;
    }

    try {
      setIsAnalyzing(true);

      /*
       * 여섯 개 설문 답변을 AI 분석 API에 전달하고
       * 반환된 분석 결과를 결과 화면에서도 사용할 수 있도록 저장함
       */
      const result = await analyzePersona(answers);

      setAnalysisResult(result);
      router.push("/persona/result");
    } catch (error) {
      console.error("페르소나 AI 분석에 실패했습니다.", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /*
   * 설문을 원하지 않는 사용자는 전체 설문을 건너뛰고
   * AI 상담 화면으로 바로 이동함
   * 건너뛸 경우 기존 답변을 비우고 isSkipped 상태를 저장함
   */
  const handleSkip = () => {
    skipPersona();

    /*
     * Persona를 건너뛰어도 진입 과정 자체는 완료된 것이므로
     * 다음 방문부터 Splash/Onboarding이 다시 노출되지 않도록 기록함
     */
    completeOnboarding();

    router.push("/ai");
  };

  return (
    <section className="flex min-h-full flex-col bg-background pt-[44px]">
      {/*
       * Figma의 모바일 상태바는 실제 웹 UI가 아니므로 제외함
       * 상태바 높이 44px만 레이아웃 여백으로 반영함
       */}
      <div>
        <header className="flex items-center justify-between px-2xl py-md">
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("back")}
            disabled={isAnalyzing}
            className="flex size-[24px] items-center justify-center text-icon-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:pointer-events-none"
          >
            <ChevronLeft aria-hidden="true" size={24} strokeWidth={2} />
          </button>

          <div
            className="h-[4px] w-[60px] overflow-hidden rounded-full bg-border-default"
            aria-hidden="true"
          >
            {/*
             * 현재 진행 단계에 맞춰 진행률을 계산함
             * 첫 질문부터 마지막 질문까지 단계별로 증가함
             */}
            <div
              className="h-full rounded-full bg-action-primary transition-[width]"
              style={{
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
              }}
            />
          </div>
        </header>

        <main className="flex flex-col gap-[28px] px-2xl py-lg">
          <div className="flex flex-col gap-sm">
            <p className="font-sans text-caption-12-bold text-action-primary">
              {currentStep + 1} / {totalSteps}
            </p>

            <h1 className="whitespace-pre-line font-sans text-title-24-bold text-text-primary">
              {currentQuestion.title}
            </h1>

            <p className="font-sans text-body-14-regular text-text-secondary">
              {currentQuestion.description}
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label={t("optionGroup")}
            className="flex flex-col gap-md"
          >
            {currentQuestion.options.map((option) => {
              const isSelected = selectedValue === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isAnalyzing}
                  onClick={() => handleSelect(option.value)}
                  className={[
                    "flex w-full items-center gap-md rounded-lg border-[1.5px] bg-surface px-xl py-lg text-left",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
                    "disabled:pointer-events-none",
                    isSelected
                      ? "border-action-primary"
                      : "border-border-default",
                  ].join(" ")}
                >
                  {/*
                   * 선택된 항목은 브랜드 컬러 라디오와
                   * 중앙의 흰색 점으로 상태를 구분함
                   */}
                  <span
                    aria-hidden="true"
                    className={[
                      "flex size-[20px] shrink-0 items-center justify-center rounded-full",
                      isSelected ? "bg-action-primary" : "bg-border-default",
                    ].join(" ")}
                  >
                    {isSelected && (
                      <span className="size-[6px] rounded-full bg-surface" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-sans text-label-14-bold text-text-primary">
                      {option.title}
                    </span>

                    <span className="mt-[2px] block font-sans text-caption-12-regular text-text-secondary">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </main>
      </div>

      <footer className="mt-auto flex flex-col items-center gap-lg px-2xl pb-3xl">
        <Button
          className="h-[54px] w-full"
          disabled={!selectedValue}
          loading={isAnalyzing}
          onClick={handleNext}
        >
          {currentStep === totalSteps - 1 ? t("analyze") : t("next")}
        </Button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={isAnalyzing}
          className="font-sans text-label-14-medium text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:pointer-events-none"
        >
          {t("skip")}
        </button>
      </footer>
    </section>
  );
}
