import type { PersonaAnswers } from "@/stores/personaStore";
import type { PersonaAnalysisResult } from "@/types/persona";
import { apiFetch } from "@/lib/api/client";

export async function analyzePersona(
  answers: PersonaAnswers,
  locale: string,
): Promise<PersonaAnalysisResult> {
  return apiFetch<PersonaAnalysisResult>("/api/persona/analyze", {
    method: "POST",
    body: { answers, locale },
  });
}
