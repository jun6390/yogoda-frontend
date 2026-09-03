interface PersonaAnalysisScores {
  data: number;
  content: number;
  benefit: number;
  price: number;
}

type PersonaAnalysisType =
  | "data_heavy"
  | "content_balanced"
  | "benefit_focused"
  | "saving_focused"
  | "balanced";

export interface PersonaAnalysisResult {
  type: PersonaAnalysisType;
  title: string;
  description: string;
  summary: string;
  scores: PersonaAnalysisScores;
  direction: string;
  directionDescription: string;
}
