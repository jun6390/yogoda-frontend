export type DemoUsageScenario = "baseline" | "usage-drop";

interface UsageHistoryItem {
  month: string;
  amount: number;
}

export interface UsageReport {
  source: "demo";
  scenario: DemoUsageScenario;
  period: string;
  dataUsed: number;
  dataLimit: number | null;
  callMinutes: number;
  subscriptionCount: number;
  monthlyFee: number;
  history: UsageHistoryItem[];
  averageUsage: number;
  recentAverage: number;
  previousAverage: number;
  changeRate: number;
  activeOttCount: number;
}

export interface DemoUsageResponse {
  message: string;
  report: UsageReport;
}

interface UsageRecommendationPlan {
  code: string;
  name: string;
  monthlyFee: number;
  dataDisplay?: string;
  tags?: string[];
}

export interface UsageRecommendation {
  status: "keep-current" | "recommend-change";
  headline: string;
  reason: string;
  currentPlan: UsageRecommendationPlan;
  recommendedPlan: UsageRecommendationPlan | null;
  monthlySavings: number;
  analysisSource: "ai" | "rules";
  evidence?: {
    recentAverageGb: number;
    previousAverageGb: number;
    changeRate: number;
    activeOttCount: number;
  };
}
