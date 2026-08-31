export type DemoUsageScenario = "baseline" | "usage-drop";

export interface UsageHistoryItem {
  month: string;
  amount: number;
}

export interface UsageReport {
  source: "demo";
  scenario: DemoUsageScenario;
  period: string;
  dataUsed: number;
  dataLimit: number;
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
